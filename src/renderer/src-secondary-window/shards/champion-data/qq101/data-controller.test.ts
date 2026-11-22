import {
  type Qq101RendererContext,
  createQq101SourceState
} from '@secondary-window/qq101/source-context'
import type { Qq101DataSource } from '@shared/data-sources/qq101'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useChampionDataStore } from '../store'
import { Qq101ChampionDataController } from './data-controller'
import { Qq101ChampionDataLoader } from './data-loader'
import type { Qq101ChampionDataOverview } from './types'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

function setup() {
  setActivePinia(createPinia())

  const store = useChampionDataStore()

  const state = createQq101SourceState()
  store.qq101.enabled = true

  const logger = { warn: vi.fn() }
  const getPatches = vi.fn<Qq101DataSource['getPatches']>().mockResolvedValue([
    { id: 19, name: '16.19' },
    { id: 18, name: '16.18' }
  ])
  const loader = new Qq101ChampionDataLoader(
    logger as unknown as ConstructorParameters<typeof Qq101ChampionDataLoader>[0],
    { getPatches } as unknown as Qq101DataSource
  )
  const loadOverview = vi.spyOn(loader, 'loadOverview')
  const loadClassicLanes = vi.spyOn(loader, 'loadClassicLanes')

  const call = vi.fn(async (_namespace, _method, preferences) => {
    store.settings.qq101Preferences = preferences
  })
  const controller = new Qq101ChampionDataController(
    {
      ipc: { call },
      logger,
      state,
      settings: store.settings,
      get canRequest() {
        return store.sourceStates.qq101.canRequest
      }
    } as unknown as Qq101RendererContext,
    loader,
    { setRunes: vi.fn(), setSummonerSpells: vi.fn() }
  )

  return { store, state, getPatches, loadOverview, loadClassicLanes, call, controller }
}

const result: Qq101ChampionDataOverview = {
  mode: 'ranked',
  data: { patch: '16.19', date: '20260926', champions: [] }
}

afterEach(() => setActivePinia(undefined))

describe('QQ101 ranking requests', () => {
  it('publishes concrete versions before rankings arrive and retains them on failure', async () => {
    const { state, controller, getPatches, loadOverview } = setup()
    const versions = Promise.withResolvers<Awaited<ReturnType<typeof getPatches>>>()
    const rankings = Promise.withResolvers<Qq101ChampionDataOverview>()
    getPatches.mockReturnValueOnce(versions.promise)
    loadOverview.mockReturnValueOnce(rankings.promise).mockResolvedValueOnce(result)

    const loading = controller.refresh()
    expect(state.requestedPreferences?.patch).toBeNull()
    expect(loadOverview).not.toHaveBeenCalled()

    versions.resolve([
      { id: 19, name: '16.19' },
      { id: 18, name: '16.18' }
    ])
    await vi.waitFor(() => expect(loadOverview).toHaveBeenCalledOnce())

    expect(state.patches).toEqual(['16.19', '16.18'])
    expect(state.requestedPreferences?.patch).toBe('16.19')
    expect(state.isLoading).toBe(true)
    expect(state.overview).toBeNull()

    rankings.reject(new Error('offline'))
    await expect(loading).resolves.toBe(false)

    expect(state.patches).toEqual(['16.19', '16.18'])
    expect(state.requestedPreferences?.patch).toBe('16.19')

    await controller.refresh()
    expect(loadOverview.mock.lastCall?.[0].patch).toBe('16.19')
    expect(state.error).toBeNull()
  })

  it('does not request rankings without versions and retries version loading', async () => {
    const { state, controller, getPatches, loadOverview } = setup()
    getPatches.mockRejectedValueOnce(new Error('version list unavailable'))
    loadOverview.mockResolvedValue(result)

    await expect(controller.refresh()).resolves.toBe(false)
    expect(loadOverview).not.toHaveBeenCalled()
    expect(state.error).toContain('version list unavailable')

    await expect(controller.refresh()).resolves.toBe(true)
    expect(state.loadedPreferences?.patch).toBe('16.19')
  })

  it('discards late versions after switching to a mode that needs no version list', async () => {
    const { state, controller, getPatches, loadOverview } = setup()
    const versions = Promise.withResolvers<Awaited<ReturnType<typeof getPatches>>>()
    getPatches.mockReturnValueOnce(versions.promise)
    loadOverview.mockResolvedValue({ mode: 'aram', data: { date: '20260926', champions: [] } })

    const ranked = controller.refresh()
    await expect(controller.changeMode('aram')).resolves.toBe(true)

    versions.resolve([{ id: 19, name: '16.19' }])
    await expect(ranked).resolves.toBe(false)

    expect(getPatches).toHaveBeenCalledOnce()
    expect(loadOverview).toHaveBeenCalledOnce()
    expect(state.patches).toEqual([])
    expect(state.loadedPreferences).toMatchObject({ mode: 'aram', patch: null })
  })

  it('preserves an explicitly selected historical version', async () => {
    const { state, controller, loadOverview } = setup()
    loadOverview.mockResolvedValue({
      mode: 'ranked',
      data: { patch: '16.18', date: '20260919', champions: [] }
    })

    await expect(controller.changePatch('16.18')).resolves.toBe(true)

    expect(loadOverview.mock.lastCall?.[0].patch).toBe('16.18')
    expect(state.loadedPreferences?.patch).toBe('16.18')
  })

  it('keeps classic lane labels visible while refreshing and replaces them on success', async () => {
    const { state, controller, loadOverview, loadClassicLanes } = setup()
    const previous: Awaited<ReturnType<Qq101ChampionDataLoader['loadClassicLanes']>> = {
      date: '20261006',
      champions: [{ classicChampionId: 1, positions: ['top'] }]
    }
    const updated: Awaited<ReturnType<Qq101ChampionDataLoader['loadClassicLanes']>> = {
      date: '20261007',
      champions: [{ classicChampionId: 1, positions: ['middle'] }]
    }
    state.classicLanes = { status: 'ready', data: previous }
    loadOverview.mockResolvedValue({
      mode: 'classic',
      data: { date: '20261007', champions: [] }
    })
    const pending = Promise.withResolvers<typeof updated>()
    loadClassicLanes.mockReturnValue(pending.promise)
    const refreshing = controller.changePreferences({ mode: 'classic' })
    await vi.waitFor(() => expect(loadClassicLanes).toHaveBeenCalledOnce())
    expect(state.isLoading).toBe(true)
    expect(state.classicLanes).toEqual({ status: 'ready', data: previous })
    pending.resolve(updated)
    await refreshing
    expect(state.classicLanes).toEqual({ status: 'ready', data: updated })
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
    const { controller, state, loadOverview, call } = setup()
    const first = Promise.withResolvers<Qq101ChampionDataOverview>()
    loadOverview.mockReturnValueOnce(first.promise).mockResolvedValueOnce(result)

    const stale = controller.changeTier(26)
    await vi.waitFor(() => expect(loadOverview).toHaveBeenCalledTimes(1))

    const current = controller.changePosition('middle')
    await vi.waitFor(() => expect(loadOverview).toHaveBeenCalledTimes(2))

    expect(loadOverview.mock.calls[0][1].aborted).toBe(true)
    expect(loadOverview.mock.calls[1][0]).toMatchObject({ tier: 26, position: 'middle' })
    await expect(current).resolves.toBe(true)
    first.resolve(result)
    await expect(stale).resolves.toBe(false)
    expect(state.loadedPreferences).toMatchObject({
      tier: 26,
      position: 'middle',
      patch: '16.19'
    })
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('retains the previous result and failed query so retry targets the same filters', async () => {
    const { controller, state, loadOverview } = setup()
    loadOverview
      .mockResolvedValueOnce(result)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(result)
    await controller.refresh()
    await expect(controller.changeTier(26)).resolves.toBe(false)
    expect(state.loadedPreferences?.tier).toBe(255)
    expect(state.requestedPreferences?.tier).toBe(26)
    expect(state.overview).toEqual(result)
    await controller.refresh()
    expect(loadOverview.mock.lastCall?.[0].tier).toBe(26)
    expect(state.error).toBeNull()
  })
})
