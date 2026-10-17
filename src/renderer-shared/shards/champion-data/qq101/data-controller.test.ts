import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import { Qq101ChampionDataController } from './data-controller'
import type { Qq101ChampionDataLoader, Qq101OverviewLoadResult } from './data-loader'

function setup() {
  setActivePinia(createPinia())
  const store = useChampionDataStore()
  store.qq101.enabled = true
  const loadOverview =
    vi.fn<
      (
        preferences: Qq101ChampionDataPreferences,
        signal: AbortSignal
      ) => Promise<Qq101OverviewLoadResult>
    >()
  const call = vi.fn(async (_namespace, _method, preferences) => {
    store.settings.qq101Preferences = preferences
  })
  const loadClassicLanes = vi.fn<Qq101ChampionDataLoader['loadClassicLanes']>()
  const controller = new Qq101ChampionDataController(
    { ipc: { call }, logger: { warn: vi.fn() } } as unknown as ChampionDataRendererContext,
    { loadOverview, loadClassicLanes } as unknown as Qq101ChampionDataLoader
  )

  return { store, loadOverview, loadClassicLanes, call, controller }
}

const result: Qq101OverviewLoadResult = {
  patch: '16.19',
  patches: ['16.19'],
  overview: { mode: 'ranked', data: { patch: '16.19', date: '20260926', champions: [] } }
}
afterEach(() => setActivePinia(undefined))

describe('QQ101 ranking requests', () => {
  it('keeps classic lane labels visible while refreshing and replaces them on success', async () => {
    const { store, controller, loadOverview, loadClassicLanes } = setup()
    const previous: Awaited<ReturnType<Qq101ChampionDataLoader['loadClassicLanes']>> = {
      date: '20261006',
      champions: [{ classicChampionId: 1, positions: ['top'] }]
    }
    const updated: Awaited<ReturnType<Qq101ChampionDataLoader['loadClassicLanes']>> = {
      date: '20261007',
      champions: [{ classicChampionId: 1, positions: ['middle'] }]
    }
    store.qq101.classicLanes = { status: 'ready', data: previous }
    loadOverview.mockResolvedValue({
      patch: null,
      patches: [],
      overview: { mode: 'classic', data: { date: '20261007', champions: [] } }
    })
    const pending = Promise.withResolvers<typeof updated>()
    loadClassicLanes.mockReturnValue(pending.promise)
    const refreshing = controller.changePreferences({ mode: 'classic' })
    await vi.waitFor(() => expect(loadClassicLanes).toHaveBeenCalledOnce())
    expect(store.qq101.isLoading).toBe(true)
    expect(store.qq101.classicLanes).toEqual({ status: 'ready', data: previous })
    pending.resolve(updated)
    await refreshing
    expect(store.qq101.classicLanes).toEqual({ status: 'ready', data: updated })
  })

  it('orders preference writes when a previous IPC save is still in flight', async () => {
    const { controller, store, loadOverview, call } = setup()
    const pending = Promise.withResolvers<void>()
    loadOverview.mockResolvedValue(result)
    call.mockImplementationOnce(async (_namespace, _method, preferences) => {
      await pending.promise
      store.settings.qq101Preferences = preferences
    })
    const first = controller.changeTier(26)
    await vi.waitFor(() => expect(call).toHaveBeenCalledTimes(1))
    const second = controller.changePosition('middle')
    await Promise.resolve()
    expect(call).toHaveBeenCalledTimes(1)
    pending.resolve()
    await expect(first).resolves.toBe(false)
    await expect(second).resolves.toBe(true)
    expect(store.settings.qq101Preferences).toMatchObject({ tier: 26, position: 'middle' })
  })

  it('combines rapid filter edits and ignores a late cancelled response', async () => {
    const { controller, store, loadOverview, call } = setup()
    const first = Promise.withResolvers<Qq101OverviewLoadResult>()
    loadOverview.mockReturnValueOnce(first.promise).mockResolvedValueOnce(result)
    const stale = controller.changeTier(26)
    const current = controller.changePosition('middle')
    expect(loadOverview.mock.calls[0][1].aborted).toBe(true)
    expect(loadOverview.mock.calls[1][0]).toMatchObject({ tier: 26, position: 'middle' })
    await expect(current).resolves.toBe(true)
    first.resolve({ ...result, patch: '16.18' })
    await expect(stale).resolves.toBe(false)
    expect(store.qq101.loadedPreferences).toMatchObject({
      tier: 26,
      position: 'middle',
      patch: '16.19'
    })
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('retains the previous result and failed query so retry targets the same filters', async () => {
    const { controller, store, loadOverview } = setup()
    loadOverview
      .mockResolvedValueOnce(result)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(result)
    await controller.refresh()
    await expect(controller.changeTier(26)).resolves.toBe(false)
    expect(store.qq101.loadedPreferences?.tier).toBe(255)
    expect(store.qq101.requestedPreferences?.tier).toBe(26)
    expect(store.qq101.overview).toEqual(result.overview)
    await controller.refresh()
    expect(loadOverview.mock.lastCall?.[0].tier).toBe(26)
    expect(store.qq101.error).toBeNull()
  })
})
