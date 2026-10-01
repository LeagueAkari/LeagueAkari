import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import type {
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionsResponse
} from '@shared/types/opgg'
import { makeAutoObservable, reaction, runInAction } from 'mobx'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

import {
  ChampionDataWindowSettings,
  ChampionDataWindowState
} from '../../window-manager/champion-data-window/state'
import type { OpggChampionDataMainContext } from '../context'
import { ChampionDataSettings, OpggChampionDataState } from '../state'
import { projectDetails, projectOverview } from './data-adapter'
import { OpggChampionDataController } from './data-controller'
import { OpggChampionDataLoader } from './data-loader'

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
    getRankedChampions: vi.fn(async (_region: unknown, options: { version?: string }) => ({
      data: overview(options.version)
    })),
    getRankedChampion: vi.fn(
      async (_region: unknown, id: number, _position: unknown, options: { version?: string }) => ({
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
  const state = new OpggChampionDataState()
  const settings = new ChampionDataSettings()
  const windowState = new ChampionDataWindowState()
  const windowSettings = new ChampionDataWindowSettings()
  windowSettings.setEnabled(false)
  const gameData = makeAutoObservable({ augments: {} as Record<number, { rarity: string }> })
  const champSelect = makeAutoObservable({
    session: null as OpggChampionDataMainContext['leagueClient']['data']['champSelect']['session'],
    disabledChampionIds: new Set<number>()
  })
  const gameflow = makeAutoObservable({
    session: null as OpggChampionDataMainContext['leagueClient']['data']['gameflow']['session']
  })
  const reactionDisposers: (() => void)[] = []

  const context = {
    state,
    settings,
    windowManager: { championDataWindow: { state: windowState, settings: windowSettings } },
    settingService: {
      set: vi.fn(async (key: string, value: unknown) => {
        await Promise.resolve()

        runInAction(() => {
          Object.assign(settings, { [key]: value })
        })
      })
    },
    logger: { warn: vi.fn() },
    mobxUtils: {
      reaction: (...args: Parameters<typeof reaction>) => {
        const dispose = reaction(...args)
        reactionDisposers.push(dispose)

        return dispose
      }
    },
    leagueClient: { data: { champSelect, gameflow, gameData } },
    extraAssets: {
      gtimg: makeAutoObservable({ kiwiAugments: null })
    }
  } as unknown as OpggChampionDataMainContext
  const loader = new OpggChampionDataLoader(api as unknown as OpggHttpApiAxiosHelper)
  const controller = new OpggChampionDataController(context, loader)
  controller.start()
  runInAction(() => {
    state.enabled = true
  })
  onTestFinished(() => {
    controller.dispose()

    for (const dispose of reactionDisposers) {
      dispose()
    }
  })
  const enableWindow = async () => {
    runInAction(() => {
      windowSettings.setEnabled(true)
    })

    await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
  }

  return {
    api,
    state,
    context,
    controller,
    loader,
    gameData,
    windowState,
    windowSettings,
    enableWindow
  }
}

describe('OP.GG main data flow', () => {
  it('limits hero pages to 20 while allowing existing pages and reopening after close', async () => {
    const { controller, state, enableWindow } = setup()
    await enableWindow()
    await controller.update({ mode: 'arena' })

    for (let id = 1; id <= 20; id++) {
      await controller.open(id)
    }

    expect(state.snapshot.openedChampions).toHaveLength(20)
    expect(await controller.open(21)).toBe(false)
    expect(await controller.update({ championId: 21 }, false, true)).toBe(false)
    expect(state.snapshot.pages[21]).toBeUndefined()
    expect(state.snapshot.activePage).toBe(20)

    await controller.activate(1)
    expect(state.snapshot.activePage).toBe(1)
    await controller.activate(null)
    expect(state.snapshot.activePage).toBeNull()
    expect(state.snapshot.openedChampions).toHaveLength(20)

    controller.close(2)
    await controller.open(21)
    expect(state.snapshot.activePage).toBe(21)
    expect(state.snapshot.openedChampions).toHaveLength(20)
  })

  it('keeps Flash preferences independent from champion data requests', async () => {
    const { state, context, controller, api, enableWindow } = setup()
    expect(context.settings.opggFlashPosition).toBe('auto')

    await enableWindow()
    await controller.update({ championId: 1 })

    const snapshot = state.snapshot
    await context.settingService.set('opggFlashPosition', 'f')

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
    const changing = controller.update({ position: 'mid' })
    expect(state.snapshot.query.position).toBe('mid')
    expect(state.snapshot.pages[1]).toMatchObject({
      stale: true,
      status: 'loading',
      champion: previous
    })
    await changing
    expect(state.snapshot.pages[1].champion?.summary.winRate).toBe(0.6)
    expect(state.snapshot.overview?.[0].winRate).toBe(0.6)
    expect(api.getRankedChampions).toHaveBeenCalledTimes(1)
  })

  it('deduplicates pages, validates order and selects the right neighbor on close', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    await controller.open(1)
    expect(state.snapshot.openedChampions).toEqual([1, 2])
    expect(api.getRankedChampion).toHaveBeenCalledTimes(2)
    controller.reorder([2, 1])
    expect(() => controller.reorder([2, 2])).toThrow('order')
    await controller.activate(2)
    controller.close(2)
    expect(state.snapshot.activePage).toBe(1)
    controller.close(1)
    expect(state.snapshot.activePage).toBeNull()
    expect(state.snapshot.openedChampions).toEqual([])
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

  it('updates every opened page for global filters with the active page first', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.open(1)
    await controller.open(2)
    api.getRankedChampion.mockClear()
    await controller.update({ tier: 'gold_plus' })
    expect(api.getRankedChampion.mock.calls.map((call) => call[1])).toEqual([2, 1])
    expect(
      Object.values(state.snapshot.pages).every((page) => !page.stale && page.status === 'ready')
    ).toBe(true)
    expect(state.snapshot.query.tier).toBe('gold_plus')
  })

  it('promotes the selected queued page without cancelling the currently running page', async () => {
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
    expect(api.getRankedChampion.mock.calls.map((call) => call[1])).toEqual([1, 3, 2])
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
    const accepted = state.snapshot.pages[1]
    pending.reject(new Error('old request failed'))
    await Promise.resolve()
    expect(state.snapshot.pages[1]).toBe(accepted)
    expect(state.snapshot.pages[1].status).toBe('ready')
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
    const first = controller.update({ tier: 'gold_plus' })
    await vi.waitFor(() => expect(api.getRankedChampions).toHaveBeenCalledTimes(2))
    const second = controller.update({ position: 'mid' })
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
    await controller.update({ mode: 'arena' })
    expect(state.snapshot.openedChampions).toEqual([1, 2])
    expect(state.snapshot.pages[2]).toMatchObject({ status: 'ready', champion: null, stale: false })
    await controller.update({ mode: 'ranked' })
    expect(state.snapshot.pages[1].champion?.summary.id).toBe(1)
    expect(state.snapshot.pages[2].champion?.summary.id).toBe(2)
  })

  it('keeps the requested version stable across individual refreshes', async () => {
    const { controller, state, enableWindow, api } = setup()
    await enableWindow()
    await controller.update({ version: '16.17' })
    await controller.open(1)
    api.getChampionVersions.mockResolvedValue({ data: { data: ['16.19'] } })
    await controller.refresh(1)
    await controller.refresh(null)
    expect(state.snapshot.version).toBe('16.17')
    expect(api.getChampionVersions).toHaveBeenCalledTimes(1)
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
    const updating = controller.update({ tier: 'gold_plus' })
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
    expect(await controller.update({ tier: 'gold_plus' })).toBe(false)
    expect(state.snapshot.pages[1].stale).toBe(true)
    expect(await controller.refresh(1)).toBe(true)
    expect(state.snapshot.pages[1]).toMatchObject({ status: 'ready', stale: false })
  })

  it('cancels the initial overview load before any hero page is opened', async () => {
    const { controller, state, windowSettings, api } = setup()
    const pending = deferred<{ data: { data: string[] } }>()
    api.getChampionVersions.mockImplementationOnce(() => pending.promise)
    runInAction(() => {
      windowSettings.setEnabled(true)
    })
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
    await controller.update({ mode: 'aram_mayhem', championId: 1 })
    expect(state.snapshot.champion?.kiwiAugmentGroups.map((group) => group.rarity)).toEqual(['all'])
    runInAction(() => {
      gameData.augments = { 10: { rarity: 'kGold' } }
    })
    expect(state.snapshot.champion?.kiwiAugmentGroups.map((group) => group.rarity)).toEqual([
      'all',
      'kGold'
    ])
    expect(api.getAramMayhemChampionAugments).toHaveBeenCalledTimes(1)
    await controller.update({ championId: null })
    expect(api.getAramMayhemTiers).toHaveBeenCalledTimes(1)
  })

  it('starts automatic loading from the window setting before the renderer is ready', async () => {
    const { state, api, windowState, windowSettings } = setup()

    expect(windowState.ready).toBe(false)
    expect(api.getChampionVersions).not.toHaveBeenCalled()

    windowSettings.setEnabled(true)

    await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
    expect(windowState.ready).toBe(false)
    expect(api.getChampionVersions).toHaveBeenCalledOnce()

    windowState.setReady(true)
    windowState.setShow(false)

    expect(api.getChampionVersions).toHaveBeenCalledOnce()
  })

  it('keeps hidden reads running, cancels when the window is disabled, and clears on gate close', async () => {
    const { controller, state, api, windowState, windowSettings, enableWindow } = setup()
    expect(await controller.refresh()).toBe(false)
    expect(api.getChampionVersions).not.toHaveBeenCalled()

    await enableWindow()
    const pending = deferred<{ data: OpggRankedChampionDetailsResponse }>()
    api.getRankedChampion.mockImplementationOnce(() => pending.promise)
    const request = controller.update({ championId: 1 })
    await vi.waitFor(() => expect(api.getRankedChampion).toHaveBeenCalled())

    runInAction(() => {
      windowState.show = false
    })

    expect(state.snapshot.status).toBe('loading')

    runInAction(() => {
      windowSettings.setEnabled(false)
    })

    await expect(request).resolves.toBe(false)
    expect(state.snapshot.status).toBe('idle')
    expect(await controller.refresh()).toBe(false)
    pending.resolve({ data: details() })

    await enableWindow()
    expect(state.snapshot.champion?.summary.id).toBe(1)

    runInAction(() => {
      state.enabled = false
    })
    expect(state.snapshot.overview).toBeNull()
    expect(state.snapshot.champion).toBeNull()
    expect(await controller.refresh()).toBe(false)

    runInAction(() => {
      state.enabled = true
    })

    await vi.waitFor(() => expect(state.snapshot.status).toBe('ready'))
    expect(state.snapshot.champion?.summary.id).toBe(1)
  })

  it('follows selection while hidden, stops when disabled, and follows the current pick on reopen', async () => {
    const { context, state, api, windowState, windowSettings, enableWindow } = setup()
    const { champSelect, gameflow } = context.leagueClient.data

    const selectChampion = (championId: number) => {
      runInAction(() => {
        champSelect.session = {
          localPlayerCellId: 1,
          myTeam: [{ cellId: 1, championId, assignedPosition: 'middle' }],
          actions: []
        } as unknown as NonNullable<typeof champSelect.session>
      })
    }

    runInAction(() => {
      gameflow.session = {
        gameData: { queue: { gameMode: 'CLASSIC' } }
      } as NonNullable<typeof gameflow.session>
    })

    selectChampion(1)
    expect(api.getChampionVersions).not.toHaveBeenCalled()

    await enableWindow()
    expect(state.snapshot.query).toMatchObject({ championId: 1, mode: 'ranked', position: 'mid' })

    runInAction(() => {
      windowState.show = false
    })

    selectChampion(2)
    await vi.waitFor(() => expect(state.snapshot.champion?.summary.id).toBe(2))

    runInAction(() => {
      windowSettings.setEnabled(false)
    })

    selectChampion(1)
    expect(state.snapshot.query.championId).toBe(2)
    expect(state.snapshot.status).toBe('idle')
    expect(api.getRankedChampion).toHaveBeenCalledTimes(2)

    await enableWindow()
    expect(state.snapshot.champion?.summary.id).toBe(1)
  })
})

describe('OP.GG projection contracts', () => {
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

    const result = projectDetails({ mode: 'ranked', response: raw }, 'top', {
      aramBalance: [],
      augmentRarity: () => null
    })

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
