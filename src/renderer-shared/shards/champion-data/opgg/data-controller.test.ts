import { parseOpggRankedDetails } from '@shared/data-adapter/opgg'
import { projectDetails, projectOverview } from '@shared/data-adapter/opgg/projection'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import type {
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionsResponse
} from '@shared/types/opgg'
import { createPinia, setActivePinia } from 'pinia'
import { assert, describe, expect, it, onTestFinished, vi } from 'vitest'
import { shallowReactive } from 'vue'

import { useChampionDataStore } from '../store'
import type { OpggRendererContext } from './context'
import { OpggChampionDataController } from './data-controller'
import { OpggChampionDataLoader } from './data-loader'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })

  return { promise, resolve, reject }
}

function overview(version = '16.18'): OpggRankedChampionsResponse {
  const stats = {
    play: 100,
    win_rate: 0.5,
    pick_rate: 0,
    ban_rate: 0,
    kda: 3,
    tier: 0,
    rank: 1,
    tier_data: { tier: 0, rank: 1, rank_prev: null, rank_prev_patch: null }
  }
  return {
    data: [1, 2, 3].map((id) => ({
      id,
      is_rotation: false,
      is_rip: false,
      average_stats: stats,
      roles: [],
      positions: [
        { name: 'TOP', stats: { ...stats, role_rate: 1 }, roles: [], counters: [] },
        { name: 'MID', stats: { ...stats, win_rate: 0.6, role_rate: 0.2 }, roles: [], counters: [] }
      ]
    })),
    meta: { version, cached_at: '', match_count: 100, analyzed_at: '' }
  }
}

function details(id = 1, version = '16.18'): OpggRankedChampionDetailsResponse {
  return {
    data: {
      summary: overview(version).data.find((item) => item.id === id)!,
      summoner_spells: [{ ids: [4, 14], play: 0, win: 0, pick_rate: 0 }],
      core_items: [],
      mythic_items: [],
      boots: [],
      starter_items: [],
      last_items: [],
      rune_pages: [],
      runes: [],
      skill_masteries: [],
      skills: [],
      skill_evolves: [],
      trends: { total_rank: 0, total_position_rank: 0, win: [], pick: [], ban: [] },
      game_lengths: [],
      counters: []
    },
    meta: { version, cached_at: '' }
  }
}

function setup() {
  const api = {
    getChampionVersions: vi.fn(async () => ({ data: { data: ['16.18', '16.17'] } })),
    getRankedChampions: vi.fn(
      async (_region: unknown, options: { version?: string; queue?: 'solo' | 'flex' }) => ({
        data: overview(options.version)
      })
    ),
    getRankedChampion: vi.fn(
      async (
        _region: unknown,
        id: number,
        _position: unknown,
        options: { version?: string; queue?: 'solo' | 'flex' }
      ) => ({
        data: details(id, options.version)
      })
    ),
    getArenaChampions: vi.fn(async () => ({
      data: { data: [], meta: { version: '16.18', cached_at: '' } }
    })),
    getAramMayhemTiers: vi.fn(async () => ({
      data: { data: [{ id: 99, champion_id: 1, rank: 1, tier: 0 }] }
    })),
    getAramMayhemChampionAugments: vi.fn(async () => ({
      data: { data: [{ id: 10, tier: null, performance: 60, popular: 2 }] }
    }))
  }
  setActivePinia(createPinia())
  const state = useChampionDataStore().opgg
  const settings = useChampionDataStore().settings
  const gameData = shallowReactive({ augments: {} as Record<number, { rarity: string }> })
  const champSelect = shallowReactive({
    session: null as OpggRendererContext['leagueClient']['champSelect']['session'],
    disabledChampionIds: new Set<number>()
  })
  const gameflow = shallowReactive({
    session: null as OpggRendererContext['leagueClient']['gameflow']['session']
  })
  const context = {
    state,
    settings,
    ipc: {
      call: vi.fn(async (_namespace: string, method: string, value: unknown) => {
        if (method === 'setOpggPreferences') {
          settings.opggPreferences = value as typeof settings.opggPreferences
        }

        if (method === 'setOpggFlashPosition') {
          settings.opggFlashPosition = value as typeof settings.opggFlashPosition
        }
      })
    },
    logger: { warn: vi.fn() },
    leagueClient: { champSelect, gameflow, gameData },
    extraAssets: { gtimg: shallowReactive({ kiwiAugments: null }) }
  } as unknown as OpggRendererContext
  const loader = new OpggChampionDataLoader(api as unknown as OpggHttpApiAxiosHelper)
  const controller = new OpggChampionDataController(context, loader)
  controller.start()
  onTestFinished(() => {
    controller.dispose()
    setActivePinia(undefined)
  })

  const enableWindow = async () => {
    state.enabled = true
    await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
  }

  return { api, state, context, controller, loader, gameData, enableWindow }
}

describe('OP.GG renderer data flow', () => {
  it('keeps solo and flex pages and cached responses separate for the same champion', async () => {
    const { controller, state, api, enableWindow } = setup()
    api.getRankedChampion.mockImplementation(async (_region, id, _position, options) => {
      const response = details(id, options.version)
      response.data.summary.positions[0].stats.play = options.queue === 'flex' ? 25 : 100

      return { data: response }
    })

    await enableWindow()
    await controller.open(1)
    const soloPage = state.snapshot.activePage!
    expect(state.snapshot.champion?.summary.play).toBe(100)

    await controller.open(1, soloPage, { mode: 'flex', version: '16.18' })
    const flexPage = state.snapshot.activePage!
    expect(flexPage).not.toBe(soloPage)
    expect(state.snapshot.champion).toMatchObject({ kind: 'flex', summary: { play: 25 } })
    expect(api.getRankedChampions).toHaveBeenLastCalledWith(
      'global',
      expect.objectContaining({ queue: 'flex' })
    )
    expect(api.getRankedChampion).toHaveBeenLastCalledWith(
      'global',
      1,
      'top',
      expect.objectContaining({ queue: 'flex', isMore: true })
    )

    await controller.activate(soloPage)
    expect(state.snapshot.champion).toMatchObject({ kind: 'ranked', summary: { play: 100 } })
    await controller.open(1, soloPage, { mode: 'flex', version: '16.18' })
    expect(state.snapshot.activePage).toBe(flexPage)
    expect(state.snapshot.openedPages).toHaveLength(2)
    expect(api.getRankedChampion).toHaveBeenCalledTimes(2)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(2)
  })

  it('uses flex data and the assigned lane when following a flex champion selection', async () => {
    const { context, state, api, enableWindow } = setup()
    const { champSelect, gameflow } = context.leagueClient
    gameflow.session = {
      gameData: { queue: { id: 440, gameMode: 'CLASSIC' } }
    } as NonNullable<typeof gameflow.session>
    champSelect.session = {
      localPlayerCellId: 1,
      myTeam: [{ cellId: 1, championId: 1, assignedPosition: 'middle' }],
      actions: []
    } as unknown as NonNullable<typeof champSelect.session>

    await enableWindow()
    expect(state.snapshot.query).toMatchObject({ championId: 1, mode: 'flex', position: 'mid' })
    expect(api.getRankedChampion).toHaveBeenLastCalledWith(
      'global',
      1,
      'mid',
      expect.objectContaining({ queue: 'flex' })
    )
  })

  it('disposes pending requests and watchers without clearing shared resource state', async () => {
    const { controller, context, state, api, enableWindow } = setup()
    await enableWindow()
    state.aramBalance = []
    const resources = state.aramBalance
    const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
    api.getRankedChampion.mockImplementationOnce(() => pending.promise)
    const opening = controller.open(1)
    await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalledOnce())
    controller.dispose()
    pending.resolve({ data: details() })
    await opening
    expect(state.snapshot.champion).toBeNull()
    expect(state.aramBalance).toBe(resources)
    state.enabled = false
    state.enabled = true
    context.leagueClient.champSelect.session = null
    await Promise.resolve()
    expect(api.getRankedChampion).toHaveBeenCalledOnce()
  })
  it('opens the same hero under different queries and reuses an exact match', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    const topPage = state.snapshot.activePage!
    await controller.activate(null)
    await controller.updateQuery({
      position: 'mid',
      tier: 'gold_plus',
      region: 'kr',
      version: '16.17'
    })
    await controller.open(1)
    const midPage = state.snapshot.activePage!
    expect(midPage).not.toBe(topPage)
    expect(state.snapshot.pages[topPage].query).toMatchObject({
      position: 'top',
      tier: 'all',
      region: 'global',
      version: '16.18'
    })
    expect(state.snapshot.pages[midPage].query).toMatchObject({
      position: 'mid',
      tier: 'gold_plus',
      region: 'kr',
      version: '16.17'
    })
    const reads = api.getRankedChampion.mock.calls.length
    await controller.open(1)
    expect(state.snapshot.activePage).toBe(midPage)
    expect(state.snapshot.openedPages).toHaveLength(2)
    expect(api.getRankedChampion).toHaveBeenCalledTimes(reads)
    await controller.activate(topPage)
    expect(state.snapshot.query.position).toBe('top')
    await controller.updateQuery({
      position: 'mid',
      tier: 'gold_plus',
      region: 'kr',
      version: '16.17'
    })
    expect(state.snapshot.openedPages).toHaveLength(2)
  })

  it('targets an explicit background page without changing the active page', async () => {
    const { controller, state, enableWindow } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    const active = state.snapshot.pages[2]
    await controller.updateQuery({ position: 'mid' }, false, false, 1)
    expect(state.snapshot.activePage).toBe(2)
    expect(state.snapshot.pages[2]).toBe(active)
    expect(state.snapshot.pages[1].query.position).toBe('mid')
    expect(state.snapshot.query.position).toBe('top')
  })

  it('limits hero pages to 20 while allowing existing pages and reopening after close', async () => {
    const { controller, state, enableWindow } = setup()
    await enableWindow()
    await controller.updateQuery({ mode: 'arena' })

    for (let id = 1; id <= 20; id++) {
      await controller.open(id)
    }

    expect(state.snapshot.openedPages).toHaveLength(20)
    expect(await controller.open(21)).toBe(false)
    expect(await controller.updateQuery({ championId: 21 }, false, true)).toBe(false)
    expect(state.snapshot.pages[21]).toBeUndefined()
    expect(state.snapshot.activePage).toBe(20)

    await controller.activate(1)
    expect(state.snapshot.activePage).toBe(1)
    await controller.activate(null)
    expect(state.snapshot.activePage).toBeNull()
    expect(state.snapshot.openedPages).toHaveLength(20)

    controller.close(2)
    await controller.open(21)
    expect(state.snapshot.activePage).toBe(21)
    expect(state.snapshot.openedPages).toHaveLength(20)
  })

  it('keeps Flash preferences independent from champion data requests', async () => {
    const { state, context, controller, api, enableWindow } = setup()
    expect(context.settings.opggFlashPosition).toBe('auto')

    await enableWindow()
    await controller.updateQuery({ championId: 1 })

    const snapshot = state.snapshot
    await controller.setFlashPosition('f')

    expect(context.settings.opggFlashPosition).toBe('f')
    expect(state.snapshot).toBe(snapshot)
    expect(api.getChampionVersions).toHaveBeenCalledTimes(1)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(1)
    expect(api.getRankedChampion).toHaveBeenCalledTimes(1)
  })

  it('reprojects position statistics while retaining stale data until the new page is ready', async () => {
    const { controller, state, api, enableWindow } = setup()
    await enableWindow()
    await controller.open(1)
    expect(state.snapshot.overview?.[0]).toMatchObject({ tier: 0, pickRate: 0, banRate: 0 })
    const previous = state.snapshot.pages[1].champion
    const changing = controller.updateQuery({ position: 'mid' })
    expect(state.snapshot.query.position).toBe('mid')
    expect(state.snapshot.pages[1]).toMatchObject({
      stale: true,
      status: 'loading',
      champion: previous
    })
    await changing
    expect(state.snapshot.pages[1].champion?.summary.winRate).toBe(0.6)
    expect(state.snapshot.overview?.[0].winRate).toBe(0.5)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(1)
  })

  it('deduplicates pages, validates order and selects the right neighbor on close', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    await controller.open(1)
    expect(state.snapshot.openedPages).toEqual([1, 2])
    expect(api.getRankedChampion).toHaveBeenCalledTimes(2)
    controller.reorder([2, 1])
    await expect(controller.reorder([2, 2])).rejects.toThrow('order')
    await controller.activate(2)
    controller.close(2)
    expect(state.snapshot.activePage).toBe(1)
    controller.close(1)
    expect(state.snapshot.activePage).toBeNull()
    expect(state.snapshot.openedPages).toEqual([])
    expect(state.snapshot.overview).not.toBeNull()
  })

  it('refreshes a background page independently without switching or resolving a newer version', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    const page2 = state.snapshot.pages[2]
    const overviewData = state.snapshot.overview
    await controller.refresh(1)
    expect(state.snapshot.activePage).toBe(2)
    expect(state.snapshot.pages[2]).toBe(page2)
    expect(state.snapshot.overview).toBe(overviewData)
    expect(api.getChampionVersions).toHaveBeenCalledTimes(1)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(1)
    const page1 = state.snapshot.pages[1]
    await controller.refresh(null)
    expect(state.snapshot.pages[1]).toBe(page1)
    expect(state.snapshot.pages[2]).toBe(page2)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(2)
  })

  it('updates only the active page and preserves other page queries', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    api.getRankedChampion.mockClear()
    await controller.updateQuery({ tier: 'gold_plus' })
    expect(api.getRankedChampion.mock.calls.map((call) => call[1])).toEqual([2])
    expect(
      Object.values(state.snapshot.pages).every((page) => !page.stale && page.status === 'ready')
    ).toBe(true)
    expect(state.snapshot.query.tier).toBe('gold_plus')
    expect(state.snapshot.pages[1].query.tier).toBe('all')
    expect(state.snapshot.overviewState.query.tier).toBe('all')
  })

  it('switches to a queued page without cancelling any other page', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
    api.getRankedChampion.mockImplementationOnce(() => pending.promise)
    const first = controller.open(1)
    await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalledTimes(1))
    const second = controller.open(2)
    const third = controller.open(3)
    await vi.waitFor(() => expect(state.snapshot.pages[3].status).toBe('loading'))
    await controller.activate(3)
    pending.resolve({ data: details(1) })
    await Promise.all([first, second, third])
    expect(api.getRankedChampion.mock.calls.map((call) => call[1])).toEqual([1, 2, 3])
    expect(state.snapshot.activePage).toBe(3)
  })

  it('ignores a late closed-page response, including when the same hero is reopened', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
    api.getRankedChampion.mockImplementationOnce(() => pending.promise)
    const first = controller.open(1)
    await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalledTimes(1))
    controller.close(1)
    await expect(first).resolves.toBe(false)
    await controller.open(1)
    const newId = state.snapshot.activePage!
    const accepted = state.snapshot.pages[newId]
    pending.reject(new Error('old request failed'))
    await Promise.resolve()
    expect(state.snapshot.pages[newId]).toBe(accepted)
    expect(state.snapshot.pages[1]).toBeUndefined()
    expect(state.snapshot.pages[newId].status).toBe('ready')
  })

  it('isolates page failure and lets queued pages finish', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    api.getRankedChampion.mockRejectedValueOnce(new Error('one page failed'))
    const first = controller.open(1)
    const second = controller.open(2)
    await Promise.all([first, second])
    expect(state.snapshot.pages[1]).toMatchObject({ status: 'error', stale: true })
    expect(state.snapshot.pages[2].status).toBe('ready')
    expect(state.snapshot.overviewState.status).toBe('ready')
  })

  it('cancels only the requested page and retains its data as stale', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
    api.getRankedChampion.mockImplementationOnce(() => pending.promise)
    const refresh = controller.refresh(1)
    await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalledTimes(3))
    controller.cancelPage(1)
    await expect(refresh).resolves.toBe(false)
    expect(state.snapshot.pages[1]).toMatchObject({ status: 'idle', stale: true })
    expect(state.snapshot.pages[2].status).toBe('ready')
    pending.resolve({ data: details(1) })
  })

  it('cancels old global generations and merges rapid query changes', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    const pending = deferred<{ data: OpggRankedChampionsResponse }>()
    api.getRankedChampions.mockImplementationOnce(() => pending.promise)
    const first = controller.updateQuery({ tier: 'gold_plus' })
    await vi.waitFor(() => expect(api.getRankedChampions).toHaveBeenCalledTimes(2))
    const second = controller.updateQuery({ position: 'mid' })
    await second
    pending.resolve({ data: overview() })
    await expect(first).resolves.toBe(false)
    expect(state.snapshot.query).toMatchObject({ tier: 'gold_plus', position: 'mid' })
    expect(state.snapshot.pages[1].champion?.summary.winRate).toBe(0.6)
    expect(state.snapshot.pages[1].stale).toBe(false)
  })

  it('retains pages with no data when modes change and recovers when switching back', async () => {
    const { controller, state, enableWindow } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    await controller.updateQuery({ mode: 'arena' })
    expect(state.snapshot.openedPages).toEqual([1, 2])
    expect(state.snapshot.pages[2]).toMatchObject({ status: 'ready', champion: null, stale: false })
    await controller.updateQuery({ mode: 'ranked' })
    expect(state.snapshot.pages[1].champion?.summary.championId).toBe(1)
    expect(state.snapshot.pages[2].champion?.summary.championId).toBe(2)
  })

  it('keeps the requested version stable across individual refreshes', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.updateQuery({ version: '16.17' })
    await controller.open(1)
    api.getChampionVersions.mockResolvedValue({ data: { data: ['16.19'] } })
    await controller.refresh(1)
    await controller.refresh(null)
    expect(state.snapshot.version).toBe('16.17')
    expect(api.getChampionVersions).toHaveBeenCalledTimes(2)
    expect(api.getRankedChampion).toHaveBeenLastCalledWith(
      'global',
      1,
      'top',
      expect.objectContaining({ version: '16.17' })
    )
  })

  it('does not restart a page cancelled while shared dependencies are loading', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    const pending = deferred<{ data: OpggRankedChampionsResponse }>()
    api.getRankedChampions.mockImplementationOnce(() => pending.promise)
    api.getRankedChampion.mockClear()
    const updating = controller.updateQuery({ tier: 'gold_plus' })
    await vi.waitFor(() => expect(api.getRankedChampions).toHaveBeenCalledTimes(2))
    controller.cancelPage(1)
    pending.resolve({ data: overview() })
    await updating
    expect(state.snapshot.pages[1]).toMatchObject({ status: 'idle', stale: true })
    expect(api.getRankedChampion.mock.calls.map((call) => call[1])).toEqual([2])
  })

  it('retries failed global dependencies instead of leaving all tabs stuck', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    api.getRankedChampions.mockRejectedValueOnce(new Error('offline'))
    expect(await controller.updateQuery({ tier: 'gold_plus' })).toBe(false)
    expect(state.snapshot.pages[1].stale).toBe(true)
    expect(await controller.refresh(1)).toBe(true)
    expect(state.snapshot.pages[1]).toMatchObject({ status: 'ready', stale: false })
  })

  it('cancels the initial overview load before any hero page is opened', async () => {
    const { controller, state, api } = setup()
    const pending = deferred<{ data: { data: string[] } }>()
    api.getChampionVersions.mockImplementationOnce(() => pending.promise)
    state.enabled = true
    await vi.waitFor(() => expect(api.getChampionVersions).toHaveBeenCalledTimes(1))
    controller.cancelPage(null)
    pending.resolve({ data: { data: ['16.18'] } })
    await Promise.resolve()
    expect(state.snapshot.overviewState.status).toBe('idle')
    expect(api.getRankedChampions).not.toHaveBeenCalled()
  })

  it('reprojects late augment metadata without another network request', async () => {
    const { controller, state, api, gameData, enableWindow } = setup()
    await enableWindow()
    await controller.updateQuery({ mode: 'aram_mayhem', championId: 1 })
    assert(state.snapshot.champion?.kind === 'aram_mayhem')
    expect(state.snapshot.champion.kiwiAugmentGroups.map((group) => group.rarity)).toEqual(['all'])
    gameData.augments = { 10: { rarity: 'kGold' } }
    assert(state.snapshot.champion?.kind === 'aram_mayhem')
    expect(state.snapshot.champion.kiwiAugmentGroups.map((group) => group.rarity)).toEqual([
      'all',
      'kGold'
    ])
    expect(api.getAramMayhemChampionAugments).toHaveBeenCalledTimes(1)
    await controller.updateQuery({ championId: null })
    expect(api.getAramMayhemTiers).toHaveBeenCalledTimes(1)
  })

  it('does not load before the renderer source is enabled', async () => {
    const { api, enableWindow } = setup()
    expect(api.getChampionVersions).not.toHaveBeenCalled()
    await enableWindow()
    expect(api.getChampionVersions).toHaveBeenCalledOnce()
  })

  it.each(['remote', 'local'] as const)(
    'cancels pending reads when the %s source switch is disabled',
    async (switchKind) => {
      const { controller, state, context, api, enableWindow } = setup()
      const setEnabled = (enabled: boolean) => {
        if (switchKind === 'remote') {
          state.enabled = enabled
        } else {
          context.settings.sourcePreferences = {
            enabled: { opgg: enabled, qq101: true },
            defaultSource: 'qq101'
          }
        }
      }
      expect(await controller.refresh()).toBe(false)
      expect(api.getChampionVersions).not.toHaveBeenCalled()

      await enableWindow()
      const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
      api.getRankedChampion.mockImplementationOnce(() => pending.promise)
      const request = controller.updateQuery({ championId: 1 })
      await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalled())

      expect(state.snapshot.status).toBe('loading')

      setEnabled(false)

      await expect(request).resolves.toBe(false)
      expect(state.snapshot.status).toBe('idle')
      expect(await controller.refresh()).toBe(false)
      pending.resolve({ data: details() })

      setEnabled(true)
      await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
      expect(state.snapshot.champion?.summary.championId).toBe(1)

      setEnabled(false)
      expect(state.snapshot.overview).toBeNull()
      expect(state.snapshot.champion).toBeNull()
      expect(await controller.refresh()).toBe(false)

      setEnabled(true)

      await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
      expect(state.snapshot.champion?.summary.championId).toBe(1)
    }
  )

  it('follows selection while hidden, stops when disabled, and follows the current pick on reopen', async () => {
    const { context, state, api, enableWindow } = setup()
    const { champSelect, gameflow } = context.leagueClient

    const selectChampion = (championId: number) => {
      champSelect.session = {
        localPlayerCellId: 1,
        myTeam: [{ cellId: 1, championId, assignedPosition: 'middle' }],
        actions: []
      } as unknown as NonNullable<typeof champSelect.session>
    }

    gameflow.session = {
      gameData: { queue: { gameMode: 'CLASSIC' } }
    } as NonNullable<typeof gameflow.session>

    selectChampion(1)
    expect(api.getChampionVersions).not.toHaveBeenCalled()

    await enableWindow()
    expect(state.snapshot.query).toMatchObject({ championId: 1, mode: 'ranked', position: 'mid' })

    selectChampion(2)
    await vi.waitFor(() => expect(state.snapshot.champion?.summary.championId).toBe(2))

    state.enabled = false

    selectChampion(1)
    expect(state.snapshot.query.championId).toBe(2)
    expect(state.snapshot.status).toBe('idle')
    expect(api.getRankedChampion).toHaveBeenCalledTimes(2)

    await enableWindow()
    expect(state.snapshot.champion?.summary.championId).toBe(1)
  })
})

describe('OP.GG projection contracts', () => {
  it('preserves purchase order, exact counts and optional item progression', () => {
    const raw = details()
    const single = { ids: [3031], play: 270, win: 93, pick_rate: 0.2 }
    const combined = { ...single, ids: [6672, 3031] }
    raw.data.single_items = [{ depth: 1, items: [single] }]
    raw.data.combination_items = [{ depth: 1, items: [combined] }]
    const parsed = parseOpggRankedDetails(raw)
    expect(parsed.issues).toEqual([])

    const result = projectDetails({ mode: 'flex', response: parsed.data }, 'top', {
      aramBalance: [],
      augmentRarity: () => null
    })
    assert(result.kind === 'flex')
    expect(result.itemBuildsByOrder).toMatchObject({
      single: [{ order: 1, builds: [{ itemIds: [3031], play: 270, win: 93, winRate: 93 / 270 }] }],
      combined: [
        { order: 2, builds: [{ itemIds: [6672, 3031], play: 270, win: 93, winRate: 93 / 270 }] }
      ]
    })

    const withoutProgression = parseOpggRankedDetails(details())
    expect(withoutProgression.issues).toEqual([])
    expect(withoutProgression.data.data.single_items).toEqual([])
    expect(withoutProgression.data.data.combination_items).toEqual([])
  })

  it('isolates damaged item stages and does not count empty stages as visible content', () => {
    const raw = details()
    raw.data.summoner_spells = []
    const parsed = parseOpggRankedDetails({
      ...raw,
      data: {
        ...raw.data,
        single_items: [
          { depth: 0, items: [{ ids: [3031], play: 10, win: 5, pick_rate: 1 }] },
          { depth: 4, items: [{ ids: [], play: 10, win: 5, pick_rate: 1 }] }
        ]
      }
    })
    expect(parsed.issues).toHaveLength(2)
    expect(parsed.data.data.single_items).toEqual([{ depth: 4, items: [] }])
    expect(
      projectDetails({ mode: 'ranked', response: parsed.data }, 'top', {
        aramBalance: [],
        augmentRarity: () => null
      }).hasContent
    ).toBe(false)
  })

  it.each([
    { play: 270, win: 93, loss: 177, winRate: 93 / 270 },
    { play: 10, win: 0, loss: 10, winRate: 0 },
    { play: 0, win: 0, loss: 0, winRate: null }
  ])('preserves exact recommendation and matchup counts: $win / $play', (counts) => {
    const raw = details()
    raw.data.summoner_spells = [
      { ids: [4, 14], play: counts.play, win: counts.win, pick_rate: 0.2 }
    ]
    raw.data.counters = [{ champion_id: 2, play: counts.play, win: counts.win }]

    const result = projectDetails(
      { mode: 'ranked', response: parseOpggRankedDetails(raw).data },
      'top',
      {
        aramBalance: [],
        augmentRarity: () => null
      }
    )

    assert(result.kind === 'ranked')
    expect(result.summonerSpells[0]).toMatchObject(counts)
    expect(result.counters.all[0]).toMatchObject(counts)
    expect(result.summary).toMatchObject({ play: 100, win: null, loss: null, winRate: 0.5 })
  })

  it.each(['aram', 'nexus_blitz', 'urf'] as const)(
    'projects %s without a ranked position',
    (mode) => {
      const ranked = overview()
      const raw = {
        ...ranked,
        data: ranked.data.map((champion) => ({ ...champion, positions: null }))
      }
      const rawDetails = details()
      const champion = {
        ...rawDetails,
        data: {
          ...rawDetails.data,
          summary: { ...rawDetails.data.summary, positions: null }
        }
      }

      expect(
        projectOverview(
          { mode, region: 'global', tier: 'all', version: '16.18', response: raw },
          'top'
        )[0].winRate
      ).toBe(0.5)
      expect(
        projectDetails({ mode, response: champion }, 'top', {
          aramBalance: [],
          augmentRarity: () => null
        }).summary.winRate
      ).toBe(0.5)
    }
  )

  it('derives arena rates and leaves zero-game rates unknown', () => {
    const raw = {
      data: [
        {
          id: 1,
          is_rotation: false,
          is_rip: false,
          average_stats: {
            win: 50,
            play: 100,
            total_place: 250,
            first_place: 10,
            pick_rate: 0.1,
            ban_rate: 0,
            kills: 1,
            assists: 1,
            deaths: 1,
            tier: 0,
            rank: 1,
            tier_data: { tier: 0, rank: 1, rank_prev: null, rank_prev_patch: null }
          }
        }
      ],
      meta: { version: '16.18', cached_at: '' }
    }
    const loaded = {
      mode: 'arena' as const,
      region: 'global' as const,
      version: '16.18',
      response: raw
    }

    expect(projectOverview(loaded, 'top')[0]).toMatchObject({
      winRate: 0.5,
      play: 100,
      win: 50,
      loss: 50
    })
    raw.data[0].average_stats.play = 0
    raw.data[0].average_stats.win = 0
    expect(projectOverview(loaded, 'top')[0]).toMatchObject({
      winRate: null,
      play: 0,
      win: 0,
      loss: 0
    })
  })
})
