import {
  type Qq101RendererContext,
  createQq101SourceState
} from '@secondary-window/qq101/source-context'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useChampionDataStore } from '../store'
import { Qq101ChampionDataController } from './data-controller'
import type { Qq101ChampionDataLoader } from './data-loader'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

function setup() {
  setActivePinia(createPinia())
  const store = useChampionDataStore()
  const state = createQq101SourceState()
  store.qq101.enabled = true
  state.loadedPreferences = { mode: 'ranked', tier: 26, patch: '16.19', position: 'all' }
  const loadRiftSection = vi.fn(async (key: string, _query: unknown, championId: number) =>
    key === 'positions'
      ? { championId, date: '20261006', positions: [{ position: 'MIDDLE', share: 0.9 }] }
      : { championId, date: '20261006', rows: [championId] }
  )
  const loadOverview = vi.fn()
  const loadPatches = vi.fn<Qq101ChampionDataLoader['loadPatches']>()
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
    {
      logger,
      ipc: { call: vi.fn() },
      state,
      settings: store.settings,
      get canRequest() {
        return store.sourceStates.qq101.canRequest
      }
    } as unknown as Qq101RendererContext,
    {
      resolveQuery: vi.fn(async (preferences) => ({
        query: { ...preferences, patch: '16.19' },
        patches: ['16.19']
      })),
      loadRiftSection,
      loadOverview,
      loadPatches,
      loadPairs,
      loadMayhemDetails
    } as unknown as Qq101ChampionDataLoader,
    { setRunes: vi.fn(), setSummonerSpells: vi.fn() }
  )

  return { store, state, controller, loadRiftSection, loadOverview, loadPatches, loadPairs, logger }
}

afterEach(() => setActivePinia(undefined))

describe('QQ101 hero browsing', () => {
  it('resolves the current-game version before loading the hero and cancels stale targets', async () => {
    const { state, controller, loadPatches, loadRiftSection } = setup()
    const versions = Promise.withResolvers<Awaited<ReturnType<typeof loadPatches>>>()
    loadPatches.mockReturnValueOnce(versions.promise).mockResolvedValue([{ id: 20, name: '16.20' }])

    const query = { mode: 'ranked', tier: 26, position: 'MIDDLE' } as const
    const stale = controller.pages.syncCurrentGamePage(103, query, null)
    const id = state.pages.activeId

    expect(controller.pages.currentGamePage).toMatchObject({
      query: null,
      view: null,
      modeChange: { status: 'loading' }
    })
    expect(loadRiftSection).not.toHaveBeenCalled()

    await controller.pages.syncCurrentGamePage(1, query, null)
    versions.resolve([{ id: 19, name: '16.19' }])
    await stale

    expect(controller.pages.currentGamePage).toMatchObject({
      id,
      championId: 1,
      query: { ...query, patch: '16.20' },
      view: { championId: 1, patch: '16.20' }
    })
    expect(
      loadRiftSection.mock.calls.every(
        ([, query, championId]) =>
          championId === 1 && (query as { patch: string }).patch === '16.20'
      )
    ).toBe(true)
    expect(state.loadedPreferences?.patch).toBe('16.19')
    expect(state.patches).toEqual(['16.20'])

    controller.cancel()
  })

  it('reuses identical pages and keeps each page query and results independent', async () => {
    const { state, controller, loadRiftSection, loadOverview } = setup()
    await controller.selectChampion(103, 'MIDDLE')
    const firstId = state.pages.activeId
    await controller.selectChampion(86, 'TOP')
    const secondId = state.pages.activeId
    const before = loadRiftSection.mock.calls.length
    await controller.selectChampion(103, 'MIDDLE')
    expect(state.pages.items).toHaveLength(2)
    expect(state.pages.activeId).toBe(firstId)
    expect(loadRiftSection.mock.calls).toHaveLength(before)
    await controller.pages.updateHero(firstId, {
      mode: 'ranked',
      patch: '16.18',
      tier: 28,
      position: 'TOP'
    })
    expect(state.pages.items.find((p) => p.id === secondId)).toMatchObject({
      query: { patch: '16.19', tier: 26, position: 'TOP' },
      view: { championId: 86 }
    })
    expect(state.loadedPreferences).toMatchObject({
      tier: 26,
      patch: '16.19',
      position: 'all'
    })
    loadOverview.mockResolvedValue({
      mode: 'ranked',
      data: { patch: '16.19', date: '', champions: [] }
    })
    await controller.changePreferences({ tier: 255 })
    expect(state.pages.items).toHaveLength(2)
    expect(state.pages.items.find((p) => p.id === firstId)).toMatchObject({
      query: { tier: 28 }
    })
    const previousPages = [...state.pages.items]
    const requestsBeforeSorting = loadRiftSection.mock.calls.length
    controller.pages.reorder([secondId, firstId])

    expect(state.pages.items[0]).toBe(previousPages[1])
    expect(state.pages.items[1]).toBe(previousPages[0])
    expect(state.pages.activeId).toBe(firstId)
    expect(loadRiftSection.mock.calls).toHaveLength(requestsBeforeSorting)

    for (const invalidOrder of [[firstId], [firstId, firstId], [firstId, 'missing']]) {
      expect(() => controller.pages.reorder(invalidOrder)).toThrow('Invalid QQ101 tab order')
    }
    expect(state.pages.items.map((page) => page.id)).toEqual([secondId, firstId])

    controller.pages.close(firstId)
    expect(state.pages.activeId).toBe(secondId)
    controller.cancel()
  })

  it('isolates pair query cancellation from hero pages and preserves the last query', async () => {
    const { state, controller, loadPairs } = setup()
    await controller.selectChampion(103, 'MIDDLE')
    const heroId = state.pages.activeId
    controller.pages.activate('rankings')

    const query = { championId: 103, firstRole: 'all' as const, secondRole: 'all' as const }
    await controller.queryPairs(query)
    const late = Promise.withResolvers<Awaited<ReturnType<typeof loadPairs>>>()
    loadPairs.mockReturnValueOnce(late.promise)
    const stale = controller.queryPairs({ ...query, firstRole: 'tank' })
    await controller.queryPairs({ ...query, firstRole: 'mage' })
    late.resolve({ date: 'old', synergies: [] })
    await stale
    expect(state.pairQuery).toEqual({ ...query, firstRole: 'mage' })
    expect(state.pairs).toMatchObject({ status: 'ready', data: { date: '20261006' } })
    expect(state.pages.items.map((page) => page.id)).toEqual([heroId])
    expect(state.pages.activeId).toBe('rankings')
    expect(state.pages.items.find((p) => p.id === heroId)).toMatchObject({
      view: { championId: 103, mode: 'ranked' }
    })
    controller.cancel()
  })
  it('opens a hero without fetching rankings, limits concurrent sections, and retries only a failed section', async () => {
    const { state, controller, loadRiftSection, loadOverview, logger } = setup()
    let active = 0
    let maximum = 0
    let failRunes = true
    loadRiftSection.mockImplementation(async (key, _query, championId) => {
      active++
      maximum = Math.max(active, maximum)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active--
      if (key === 'runes' && failRunes) {
        throw new Error('runes unavailable')
      }

      return key === 'positions'
        ? { championId, date: '', positions: [{ position: 'JUNGLE', share: 1 }] }
        : { championId, date: '', rows: [championId] }
    })
    await controller.selectChampion(64)
    expect(loadOverview).not.toHaveBeenCalled()
    expect(maximum).toBe(4)
    const view = state.detailView
    expect(view?.mode).toBe('ranked')
    if (view?.mode !== 'ranked') {
      throw new Error('Missing view')
    }

    expect(view.position).toBe('JUNGLE')
    expect(view.sections.runes.status).toBe('error')
    expect(view.sections.build.status).toBe('ready')
    expect(view.sections.jungle.status).toBe('ready')
    expect(logger.warn).toHaveBeenCalled()
    const calls = loadRiftSection.mock.calls.length
    failRunes = false
    await controller.pages.retry(state.pages.activeId, 'runes')
    expect(loadRiftSection.mock.calls.length).toBe(calls + 1)
    expect(state.detailView?.mode === 'ranked' && state.detailView.sections.runes.status).toBe(
      'ready'
    )
  })

  it('does not let an abandoned hero overwrite the new selection', async () => {
    const { state, controller, loadRiftSection } = setup()
    const late = Promise.withResolvers<Awaited<ReturnType<typeof loadRiftSection>>>()
    loadRiftSection.mockImplementation(async (key, _query, championId) => {
      if (championId === 103) {
        return late.promise
      }

      return key === 'positions'
        ? { championId, date: '', positions: [{ position: 'TOP', share: 1 }] }
        : { championId, date: '', rows: [championId] }
    })
    const abandoned = controller.selectChampion(103)
    controller.pages.close(state.pages.activeId)
    await controller.selectChampion(86, 'TOP')
    late.resolve({ championId: 103, date: '', positions: [{ position: 'MIDDLE', share: 1 }] })
    await abandoned
    expect(state.detailView?.championId).toBe(86)
    controller.pages.close(state.pages.activeId)
    expect(state.detailView).toBeNull()
  })

  it('unlocks detail sections when a failed lane lookup is retried', async () => {
    const { state, controller, loadRiftSection } = setup()
    loadRiftSection.mockRejectedValueOnce(new Error('positions unavailable'))
    await controller.selectChampion(103)
    expect(loadRiftSection).toHaveBeenCalledTimes(1)
    await controller.pages.retry(state.pages.activeId, 'positions')
    expect(loadRiftSection.mock.calls.filter((call) => call[0] === 'build')).toHaveLength(1)
    expect(state.detailView?.mode === 'ranked' && state.detailView.position).toBe('MIDDLE')
  })
})
