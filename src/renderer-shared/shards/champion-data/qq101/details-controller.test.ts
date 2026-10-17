import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import { Qq101ChampionDataController } from './data-controller'
import type { Qq101ChampionDataLoader } from './data-loader'

function setup() {
  setActivePinia(createPinia())
  const store = useChampionDataStore()
  store.qq101.enabled = true
  store.qq101.loadedPreferences = { mode: 'ranked', tier: 26, patch: '16.19', position: 'all' }
  const loadRiftSection = vi.fn(async (key: string, _query: unknown, championId: number) =>
    key === 'positions'
      ? { championId, date: '20261006', positions: [{ position: 'MIDDLE', share: 0.9 }] }
      : { championId, date: '20261006', rows: [championId] }
  )
  const loadOverview = vi.fn()
  const loadPairs = vi.fn(async () => ({
    date: '20261006',
    synergies: [
      {
        champions: [{ championId: 103 }, { championId: 120 }],
        rank: 430,
        pickRate: 0.01,
        winRate: 0.59
      }
    ]
  }))
  const loadMayhemDetails = vi.fn(async () => ({ date: '20261006', augments: [{ augmentId: 1 }] }))
  const logger = { warn: vi.fn() }
  const controller = new Qq101ChampionDataController(
    { logger, ipc: { call: vi.fn() } } as unknown as ChampionDataRendererContext,
    {
      loadRiftSection,
      loadOverview,
      loadPairs,
      loadMayhemDetails
    } as unknown as Qq101ChampionDataLoader
  )

  return { store, controller, loadRiftSection, loadOverview, loadPairs, logger }
}

afterEach(() => setActivePinia(undefined))

describe('QQ101 hero browsing', () => {
  it('reuses identical pages and keeps each page query and results independent', async () => {
    const { store, controller, loadRiftSection, loadOverview } = setup()
    await controller.selectChampion(103, 'MIDDLE')
    const firstId = store.qq101.pages.activeId
    await controller.selectChampion(86, 'TOP')
    const secondId = store.qq101.pages.activeId
    const before = loadRiftSection.mock.calls.length
    await controller.selectChampion(103, 'MIDDLE')
    expect(store.qq101.pages.items).toHaveLength(2)
    expect(store.qq101.pages.activeId).toBe(firstId)
    expect(loadRiftSection.mock.calls).toHaveLength(before)
    await controller.pages.updateHero(firstId, {
      mode: 'ranked',
      patch: '16.18',
      tier: 28,
      position: 'TOP'
    })
    expect(store.qq101.pages.items.find((p) => p.id === secondId)).toMatchObject({
      query: { patch: '16.19', tier: 26, position: 'TOP' },
      view: { championId: 86 }
    })
    expect(store.qq101.loadedPreferences).toMatchObject({
      tier: 26,
      patch: '16.19',
      position: 'all'
    })
    loadOverview.mockResolvedValue({
      patch: '16.19',
      patches: ['16.19'],
      overview: { mode: 'ranked', data: { patch: '16.19', date: '', champions: [] } }
    })
    await controller.changePreferences({ tier: 255 })
    expect(store.qq101.pages.items).toHaveLength(2)
    expect(store.qq101.pages.items.find((p) => p.id === firstId)).toMatchObject({
      query: { tier: 28 }
    })
    const previousPages = [...store.qq101.pages.items]
    const requestsBeforeSorting = loadRiftSection.mock.calls.length
    controller.pages.reorder([secondId, firstId])

    expect(store.qq101.pages.items[0]).toBe(previousPages[1])
    expect(store.qq101.pages.items[1]).toBe(previousPages[0])
    expect(store.qq101.pages.activeId).toBe(firstId)
    expect(loadRiftSection.mock.calls).toHaveLength(requestsBeforeSorting)

    for (const invalidOrder of [[firstId], [firstId, firstId], [firstId, 'missing']]) {
      expect(() => controller.pages.reorder(invalidOrder)).toThrow('Invalid QQ101 tab order')
    }
    expect(store.qq101.pages.items.map((page) => page.id)).toEqual([secondId, firstId])

    controller.pages.close(firstId)
    expect(store.qq101.pages.activeId).toBe(secondId)
    controller.dispose()
  })

  it('isolates pair query cancellation from hero pages and preserves the last query', async () => {
    const { store, controller, loadPairs } = setup()
    await controller.selectChampion(103, 'MIDDLE')
    const heroId = store.qq101.pages.activeId
    const query = { championId: 103, firstRole: 'all' as const, secondRole: 'all' as const }
    await controller.queryPairs(query)
    const pairId = store.qq101.pages.activeId
    const late = Promise.withResolvers<Awaited<ReturnType<typeof loadPairs>>>()
    loadPairs.mockReturnValueOnce(late.promise)
    const stale = controller.pages.updatePairs(pairId, { ...query, firstRole: 'tank' })
    await controller.pages.updatePairs(pairId, { ...query, firstRole: 'mage' })
    late.resolve({ date: 'old', synergies: [] })
    await stale
    expect(store.qq101.pages.items.find((p) => p.id === pairId)).toMatchObject({
      kind: 'pairs',
      query: { firstRole: 'mage' },
      state: { status: 'ready', data: { date: '20261006' } }
    })
    expect(store.qq101.pages.items.find((p) => p.id === heroId)).toMatchObject({
      kind: 'champion',
      view: { championId: 103, mode: 'ranked' }
    })
    controller.dispose()
  })
  it('opens a hero without fetching rankings, limits concurrent sections, and retries only a failed section', async () => {
    const { store, controller, loadRiftSection, loadOverview, logger } = setup()
    let active = 0
    let maximum = 0
    let failRunes = true
    loadRiftSection.mockImplementation(async (key, _query, championId) => {
      active++
      maximum = Math.max(active, maximum)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active--
      if (key === 'runes' && failRunes) throw new Error('runes unavailable')

      return key === 'positions'
        ? { championId, date: '', positions: [{ position: 'JUNGLE', share: 1 }] }
        : { championId, date: '', rows: [championId] }
    })
    await controller.selectChampion(64)
    expect(loadOverview).not.toHaveBeenCalled()
    expect(maximum).toBe(4)
    const view = store.qq101.detailView
    expect(view?.mode).toBe('ranked')
    if (view?.mode !== 'ranked') throw new Error('Missing view')

    expect(view.position).toBe('JUNGLE')
    expect(view.sections.runes.status).toBe('error')
    expect(view.sections.build.status).toBe('ready')
    expect(view.sections.jungle.status).toBe('ready')
    expect(logger.warn).toHaveBeenCalled()
    const calls = loadRiftSection.mock.calls.length
    failRunes = false
    await controller.pages.retry(store.qq101.pages.activeId, 'runes')
    expect(loadRiftSection.mock.calls.length).toBe(calls + 1)
    expect(
      store.qq101.detailView?.mode === 'ranked' && store.qq101.detailView.sections.runes.status
    ).toBe('ready')
  })

  it('does not let an abandoned hero overwrite the new selection', async () => {
    const { store, controller, loadRiftSection } = setup()
    const late = Promise.withResolvers<Awaited<ReturnType<typeof loadRiftSection>>>()
    loadRiftSection.mockImplementation(async (key, _query, championId) => {
      if (championId === 103) return late.promise

      return key === 'positions'
        ? { championId, date: '', positions: [{ position: 'TOP', share: 1 }] }
        : { championId, date: '', rows: [championId] }
    })
    const abandoned = controller.selectChampion(103)
    controller.pages.close(store.qq101.pages.activeId)
    await controller.selectChampion(86, 'TOP')
    late.resolve({ championId: 103, date: '', positions: [{ position: 'MIDDLE', share: 1 }] })
    await abandoned
    expect(store.qq101.detailView?.championId).toBe(86)
    controller.pages.close(store.qq101.pages.activeId)
    expect(store.qq101.detailView).toBeNull()
  })

  it('unlocks detail sections when a failed lane lookup is retried', async () => {
    const { store, controller, loadRiftSection } = setup()
    loadRiftSection.mockRejectedValueOnce(new Error('positions unavailable'))
    await controller.selectChampion(103)
    expect(loadRiftSection).toHaveBeenCalledTimes(1)
    await controller.pages.retry(store.qq101.pages.activeId, 'positions')
    expect(loadRiftSection.mock.calls.filter((call) => call[0] === 'build')).toHaveLength(1)
    expect(store.qq101.detailView?.mode === 'ranked' && store.qq101.detailView.position).toBe(
      'MIDDLE'
    )
  })
})
