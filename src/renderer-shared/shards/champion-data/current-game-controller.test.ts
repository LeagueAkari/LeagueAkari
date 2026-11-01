import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import type { ChampSelectSession } from '@shared/types/league-client/champ-select'
import type { GameflowSession } from '@shared/types/league-client/gameflow'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { nextTick } from 'vue'

import { useAutoChampConfigStore } from '../auto-champ-config/store'
import type { LeagueClientRenderer } from '../league-client'
import { useLeagueClientStore } from '../league-client/store'
import { useChampionDataWindowStore } from '../window-manager/store'
import { CurrentGameController } from './current-game-controller'
import type { OpggRendererContext } from './opgg/context'
import { OpggChampionDataController } from './opgg/data-controller'
import { OpggChampionDataLoader } from './opgg/data-loader'
import type { Qq101ChampionDataLoader } from './qq101/data-loader'
import { Qq101PagesController } from './qq101/pages-controller'
import { RuneApplicationCancelled, RuneExecutor } from './rune-executor'
import { useChampionDataStore } from './store'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

const rune = {
  primaryStyleId: 8000,
  secondaryStyleId: 8100,
  primaryRuneIds: [8005, 9111, 9104, 8014],
  secondaryRuneIds: [8126, 8138],
  statShardIds: [5008, 5008, 5001]
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function setup() {
  setActivePinia(createPinia())
  const store = useChampionDataStore()
  const client = useLeagueClientStore()
  const presets = useAutoChampConfigStore()
  const window = useChampionDataWindowStore()
  client.gameData.champions = Object.fromEntries(
    Array.from({ length: 22 }, (_, index) => [
      index + 1,
      { id: index + 1, name: String(index + 1) }
    ])
  ) as typeof client.gameData.champions
  client.connectionState = 'connected'
  client.gameflow.phase = 'ChampSelect'
  client.gameflow.session = {
    gameData: {
      gameId: 42,
      teamOne: [],
      teamTwo: [],
      playerChampionSelections: [],
      queue: {
        id: 420,
        type: 'RANKED_SOLO_5x5',
        gameMode: 'CLASSIC',
        gameTypeConfig: { pickMode: 'DraftModeSinglePickStrategy' }
      }
    }
  } as unknown as GameflowSession
  window.show = true
  presets.isReady = true
  store.opgg.enabled = true
  store.qq101.enabled = true
  store.settings.automation = { ...store.settings.automation, enabled: true }

  const perks = {
    getPerkInventory: vi.fn(async () => ({ data: { canAddCustomPage: true } })),
    postPerkPage: vi.fn(async () => ({ data: { id: 100 } })),
    getPerkPages: vi.fn(async () => ({ data: [{ id: 99 }] })),
    putPage: vi.fn(async (_page: unknown) => {}),
    putCurrentPage: vi.fn(async (_id: number) => {})
  }
  const transport = { api: { perks } } as unknown as LeagueClientRenderer
  const runes = new RuneExecutor(transport)
  const stats = { play: 100, win_rate: 0.5, pick_rate: 0.1, ban_rate: 0, kda: 3, tier: 1, rank: 1 }
  const summary = (id: number) => ({ id, average_stats: stats, roles: [], positions: [] })
  const api = {
    getChampionVersions: vi.fn(async () => ({ data: { data: ['16.21'] } })),
    getRankedChampions: vi.fn(async () => ({
      data: { data: [summary(1), summary(2)], meta: { version: '16.21' } }
    })),
    getRankedChampion: vi.fn(async (_region: unknown, id: number) => ({
      data: {
        data: {
          summary: summary(id),
          runes: [
            {
              id: 1,
              primary_page_id: 8000,
              secondary_page_id: 8100,
              primary_rune_ids: rune.primaryRuneIds,
              secondary_rune_ids: rune.secondaryRuneIds,
              stat_mod_ids: rune.statShardIds,
              play: 100,
              win: 50,
              pick_rate: 1
            }
          ],
          summoner_spells: [],
          core_items: [],
          starter_items: [],
          last_items: [],
          boots: [],
          counters: [],
          skill_masteries: []
        },
        meta: { version: '16.21' }
      }
    }))
  }
  const context = {
    state: store.opgg,
    settings: store.settings,
    leagueClient: client,
    client: transport,
    extraAssets: { gtimg: { kiwiAugments: null } },
    logger: { warn: vi.fn() },
    ipc: { call: vi.fn(async () => {}) }
  } as unknown as OpggRendererContext
  const opgg = new OpggChampionDataController(
    context,
    new OpggChampionDataLoader(api as unknown as OpggHttpApiAxiosHelper),
    runes
  )
  const qqLoader = {
    loadPatches: vi.fn(async () => [{ name: '16.21' }]),
    loadRiftSection: vi.fn(async (key: string) =>
      key === 'positions'
        ? { positions: [{ position: 'MIDDLE', share: 1 }] }
        : key === 'runes'
          ? { pages: [rune], date: '', championId: 1 }
          : {}
    )
  }
  const qq101 = new Qq101PagesController(context, qqLoader as unknown as Qq101ChampionDataLoader)
  const controller = new CurrentGameController(context, opgg, qq101, runes)
  const select = (id: number, locked = true, position = 'middle') => {
    client.champSelect.session = {
      gameId: 42,
      localPlayerCellId: 0,
      isSpectating: false,
      allowRerolling: false,
      myTeam: [
        {
          cellId: 0,
          championId: id,
          championPickIntent: id,
          assignedPosition: position
        }
      ],
      actions: [[{ actorCellId: 0, type: 'pick', championId: id, completed: locked }]]
    } as unknown as ChampSelectSession
  }
  onTestFinished(() => {
    controller.dispose()
    runes.dispose()
    opgg.dispose()
    qq101.clear()
    setActivePinia(undefined)
  })
  return {
    store,
    client,
    presets,
    window,
    perks,
    runes,
    api,
    qqLoader,
    opgg,
    qq101,
    controller,
    select
  }
}

describe('current game pages and rune automation', () => {
  it('shares loaded page data, waits for lock, uses only the default source and preserves ordinary pages', async () => {
    const f = setup()
    f.select(1, false)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    await vi.waitFor(() => expect(f.qq101.currentGamePage?.view?.mode).toBe('ranked'))
    expect(f.perks.putCurrentPage).not.toHaveBeenCalled()
    expect(f.store.currentGame.status).toBe('waitingLock')
    const id = f.opgg.currentGamePageId!
    await f.opgg.open(1, id)
    const ordinary = f.store.opgg.snapshot.activePage!
    expect(ordinary).not.toBe(id)
    const syncOpggPage = vi.spyOn(f.opgg, 'syncCurrentGamePage')
    const syncQq101Page = vi.spyOn(f.qq101, 'syncCurrentGamePage')
    f.select(1, true)
    await vi.waitFor(() => expect(f.perks.putCurrentPage).toHaveBeenCalledOnce())
    expect(syncOpggPage).not.toHaveBeenCalled()
    expect(syncQq101Page).not.toHaveBeenCalled()
    expect(f.api.getRankedChampion).toHaveBeenCalledTimes(2) // One managed and one deliberately independent ordinary page.
    await f.opgg.refresh(id)
    f.window.show = false
    await nextTick()
    f.window.show = true
    await nextTick()
    expect(f.perks.putCurrentPage).toHaveBeenCalledOnce()
    f.client.gameflow.phase = 'InProgress'
    await nextTick()
    expect(f.opgg.currentGamePageId).toBe(id)
    f.client.gameflow.phase = 'PreEndOfGame'
    await nextTick()
    expect(f.opgg.currentGamePageId).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()
    expect(f.store.opgg.snapshot.openedPages).toEqual([ordinary])
  })

  it('updates a stable page on swaps and uses the assigned lane for flex', async () => {
    const f = setup()
    f.client.gameflow.session!.gameData.queue.id = 440
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.putCurrentPage).toHaveBeenCalledOnce())
    const opggId = f.opgg.currentGamePageId
    const qqId = f.qq101.currentGamePage!.id
    expect(f.opgg.currentGamePage?.query).toMatchObject({ mode: 'flex', position: 'mid' })
    f.select(2)
    await vi.waitFor(() => expect(f.perks.putCurrentPage).toHaveBeenCalledTimes(2))
    expect(f.opgg.currentGamePageId).toBe(opggId)
    expect(f.qq101.currentGamePage!.id).toBe(qqId)
    expect(f.opgg.currentGamePage?.query.championId).toBe(2)
  })

  it('keeps managed pages and the application record when game IDs change across retained phases', async () => {
    const f = setup()
    f.client.gameflow.session!.gameData.gameId = 41
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    await vi.waitFor(() =>
      expect(f.qq101.currentGamePage?.view).toMatchObject({
        mode: 'ranked',
        sections: { runes: { status: 'ready' } }
      })
    )
    const opggId = f.opgg.currentGamePageId
    const qqId = f.qq101.currentGamePage!.id

    // The live client kept the previous game ID until just before GameStart.
    // IDs can also be absent or arrive out of order while phases advance.
    for (const [phase, gameId] of [
      ['ChampSelect', 42],
      ['GameStart', 41],
      ['InProgress', 0],
      ['Reconnect', 43]
    ] as const) {
      f.client.gameflow.session = {
        ...f.client.gameflow.session!,
        phase,
        gameData: { ...f.client.gameflow.session!.gameData, gameId }
      }
      f.client.gameflow.phase = phase
      if (phase !== 'ChampSelect') f.client.champSelect.session = null
      await nextTick()

      expect(f.opgg.currentGamePageId).toBe(opggId)
      expect(f.opgg.currentGamePage?.status).toBe('ready')
      expect(f.qq101.currentGamePage?.id).toBe(qqId)
      expect(f.qq101.currentGamePage?.view).toMatchObject({
        mode: 'ranked',
        sections: { runes: { status: 'ready' } }
      })
      expect(f.store.currentGame.status).toBe(phase === 'ChampSelect' ? 'applied' : 'inGame')
    }
    expect(f.api.getRankedChampion).toHaveBeenCalledOnce()
    expect(f.qqLoader.loadPatches).toHaveBeenCalledOnce()
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })

  it('starts a fresh lifecycle after an ending phase even when the hero and game ID are unchanged', async () => {
    const f = setup()
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    const opggId = f.opgg.currentGamePageId
    const qqId = f.qq101.currentGamePage!.id

    f.client.gameflow.phase = 'EndOfGame'
    await nextTick()
    expect(f.opgg.currentGamePage).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()

    f.select(1)
    f.client.gameflow.phase = 'ChampSelect'
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.opgg.currentGamePageId).not.toBe(opggId)
    expect(f.qq101.currentGamePage!.id).not.toBe(qqId)
    expect(f.perks.putPage).toHaveBeenCalledTimes(2)
  })

  it('keeps a pending application and loaded pages across unrelated client snapshot updates', async () => {
    const f = setup()
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    await vi.waitFor(() =>
      expect(f.qq101.currentGamePage?.view).toMatchObject({
        mode: 'ranked',
        sections: { runes: { status: 'ready' } }
      })
    )
    const opggPage = f.opgg.currentGamePage
    const qqPage = f.qq101.currentGamePage

    const session = f.client.champSelect.session!
    f.client.champSelect.session = {
      ...session,
      counter: 10,
      myTeam: [...session.myTeam, { ...session.myTeam[0], cellId: 1, championId: 2 }]
    }
    f.client.gameflow.session = {
      ...f.client.gameflow.session!,
      gameData: { ...f.client.gameflow.session!.gameData, gameId: 999 }
    }
    f.client.gameData.champions = { ...f.client.gameData.champions }
    f.window.status = 'minimized'
    await nextTick()
    expect(f.store.currentGame.status).toBe('applying')
    expect(f.opgg.currentGamePage).toBe(opggPage)
    expect(f.qq101.currentGamePage).toBe(qqPage)

    inventory.resolve({ data: { canAddCustomPage: true } })
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.perks.getPerkInventory).toHaveBeenCalledOnce()
    expect(f.perks.putPage).toHaveBeenCalledOnce()
    expect(f.api.getRankedChampion).toHaveBeenCalledOnce()
    expect(f.qqLoader.loadPatches).toHaveBeenCalledOnce()
  })

  it('closes a previously locked page and cancels its pending write when the champion ID becomes zero', async () => {
    const f = setup()
    const apply = vi.spyOn(f.runes, 'apply')
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    const id = f.opgg.currentGamePageId

    f.select(0, false, '')
    await nextTick()
    expect(f.opgg.currentGamePage).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()
    expect(f.store.currentGame.status).toBe('waitingChampion')
    inventory.resolve({ data: { canAddCustomPage: true } })
    await expect(apply.mock.results[0].value).rejects.toBeInstanceOf(RuneApplicationCancelled)
    expect(f.perks.postPerkPage).not.toHaveBeenCalled()

    f.select(1)
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.opgg.currentGamePageId).not.toBe(id)
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })

  it('keeps the pending default-source task when only the other source preferences and data change', async () => {
    const f = setup()
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())

    f.store.settings.automation = {
      ...f.store.settings.automation,
      qq101: { tier: 7 }
    }
    await vi.waitFor(() =>
      expect(f.qq101.currentGamePage).toMatchObject({
        query: { tier: 7 },
        view: { mode: 'ranked', sections: { runes: { status: 'ready' } } }
      })
    )
    f.store.qq101.enabled = false
    await nextTick()
    expect(f.qq101.currentGamePage).toBeNull()

    inventory.resolve({ data: { canAddCustomPage: true } })
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.perks.getPerkInventory).toHaveBeenCalledOnce()
    expect(f.perks.putPage).toHaveBeenCalledOnce()
    expect(f.api.getRankedChampion).toHaveBeenCalledOnce()
  })

  it.each(['query', 'source', 'position'] as const)(
    'replaces a pending task after its %s changes even when the recommended runes stay the same',
    async (change) => {
      const f = setup()
      const apply = vi.spyOn(f.runes, 'apply')
      const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
      f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
      f.select(1)
      f.controller.start()
      await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())

      if (change === 'query') {
        f.store.settings.automation = {
          ...f.store.settings.automation,
          opgg: { region: 'kr', tier: 'gold_plus' }
        }
        await vi.waitFor(() =>
          expect(f.opgg.currentGamePage).toMatchObject({
            status: 'ready',
            query: { region: 'kr', tier: 'gold_plus' }
          })
        )
      } else if (change === 'source') {
        f.store.settings.sourcePreferences = {
          ...f.store.settings.sourcePreferences,
          defaultSource: 'qq101'
        }
        await vi.waitFor(() =>
          expect(f.qq101.currentGamePage?.view).toMatchObject({
            mode: 'ranked',
            sections: { runes: { status: 'ready' } }
          })
        )
      } else {
        f.select(1, true, 'top')
        await vi.waitFor(() =>
          expect(f.opgg.currentGamePage).toMatchObject({
            status: 'ready',
            query: { position: 'top' }
          })
        )
      }

      inventory.resolve({ data: { canAddCustomPage: true } })
      await expect(apply.mock.results[0].value).rejects.toBeInstanceOf(RuneApplicationCancelled)
      await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
      expect(f.perks.getPerkInventory).toHaveBeenCalledTimes(2)
      expect(f.perks.putPage).toHaveBeenCalledOnce()
    }
  )

  it('keeps pages while hidden, pauses writes, and continues when minimized or shown', async () => {
    const f = setup()
    f.window.show = false
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    expect(f.store.currentGame.status).toBe('paused')
    expect(f.perks.postPerkPage).not.toHaveBeenCalled()
    f.window.show = true
    f.window.status = 'minimized'
    await vi.waitFor(() => expect(f.perks.putCurrentPage).toHaveBeenCalledOnce())
    f.window.show = false
    f.select(2)
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.query.championId).toBe(2))
    expect(f.store.currentGame.status).toBe('paused')
    expect(f.perks.putCurrentPage).toHaveBeenCalledOnce()
  })

  it.each(['missingPosition', 'preset', 'unsupportedMode'] as const)(
    'explains %s without writing',
    async (reason) => {
      const f = setup()
      if (reason === 'preset') {
        f.presets.settings.enabled = true
        f.presets.settings.runesV2 = {
          1: { 'ranked-default': { primaryStyleId: 8000, subStyleId: 8100, selectedPerkIds: [] } }
        }
      }
      if (reason === 'unsupportedMode')
        f.client.gameflow.session!.gameData.queue.gameMode = 'UNKNOWN'
      f.select(1, true, reason === 'missingPosition' ? '' : 'middle')
      f.controller.start()
      await nextTick()
      expect(f.store.currentGame.status).toBe(reason)
      expect(f.opgg.currentGamePage).not.toBeNull()
      expect(f.qq101.currentGamePage).not.toBeNull()
      expect(f.perks.getPerkInventory).not.toHaveBeenCalled()
    }
  )

  it('waits for saved presets to synchronize before any automatic write', async () => {
    const f = setup()
    f.presets.isReady = false
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    expect(f.perks.getPerkInventory).not.toHaveBeenCalled()
    f.presets.settings.enabled = true
    f.presets.settings.runesV2 = {
      1: { 'ranked-middle': { primaryStyleId: 8000, subStyleId: 8100, selectedPerkIds: [] } }
    }
    f.presets.isReady = true
    await nextTick()
    expect(f.store.currentGame.status).toBe('preset')
  })

  it('separates data retry from write retry and never falls back to the other source', async () => {
    const f = setup()
    f.api.getRankedChampion.mockRejectedValueOnce(new Error('offline'))
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('loadError'))
    expect(f.perks.getPerkInventory).not.toHaveBeenCalled()
    f.perks.putPage.mockRejectedValueOnce(new Error('write failed'))
    await f.opgg.refresh(f.opgg.currentGamePageId)
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applyError'))
    const reads = f.api.getRankedChampion.mock.calls.length
    f.controller.retryApplication()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.api.getRankedChampion).toHaveBeenCalledTimes(reads)
  })

  it('uses QQ101 only when it is the default and does not fall back from empty latest data', async () => {
    const f = setup()
    f.store.settings.sourcePreferences = {
      ...f.store.settings.sourcePreferences,
      defaultSource: 'qq101'
    }
    f.qqLoader.loadRiftSection.mockImplementation(async (key) =>
      key === 'positions' ? { positions: [{ position: 'MIDDLE', share: 1 }] } : {}
    )
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('empty'))
    expect(f.perks.putPage).not.toHaveBeenCalled()
    expect(f.qq101.currentGamePage?.query).toMatchObject({ patch: '16.21' })
    f.qqLoader.loadRiftSection.mockImplementation(async (key) =>
      key === 'runes' ? { pages: [rune], date: '', championId: 1 } : {}
    )
    await f.qq101.retry(f.qq101.currentGamePage!.id, 'runes')
    await vi.waitFor(() => expect(f.perks.putCurrentPage).toHaveBeenCalledOnce())
  })

  it('invalidates an in-flight automatic write on hide and lets manual application take priority', async () => {
    const f = setup()
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    f.window.show = false
    await nextTick()
    inventory.resolve({ data: { canAddCustomPage: true } })
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('paused'))
    expect(f.perks.postPerkPage).not.toHaveBeenCalled()
    await f.runes.apply(
      {
        primaryStyleId: 8000,
        subStyleId: 8100,
        selectedPerkIds: [...rune.primaryRuneIds, ...rune.secondaryRuneIds, ...rune.statShardIds]
      },
      'Manual'
    )
    f.window.show = true
    await nextTick()
    expect(f.store.currentGame.status).toBe('manual')
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })

  it('reloads new defaults without changing ordinary pages or applying twice', async () => {
    const f = setup()
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    const id = f.opgg.currentGamePageId!
    await f.opgg.open(1, id)
    const ordinary = f.store.opgg.snapshot.activePage!
    f.store.settings.automation = {
      ...f.store.settings.automation,
      opgg: { region: 'kr', tier: 'gold_plus' }
    }
    await vi.waitFor(() =>
      expect(f.opgg.currentGamePage?.query).toMatchObject({ region: 'kr', tier: 'gold_plus' })
    )
    expect(f.opgg.currentGamePageId).toBe(id)
    expect(f.store.opgg.snapshot.pages[ordinary].query.region).toBe('global')
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })
  it('rejects stale writes after a rapid champion and preference change', async () => {
    const f = setup()
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    f.select(2)
    f.store.settings.automation = {
      ...f.store.settings.automation,
      opgg: { region: 'kr', tier: 'gold_plus' }
    }
    await vi.waitFor(() =>
      expect(f.opgg.currentGamePage).toMatchObject({
        status: 'ready',
        query: { championId: 2, region: 'kr' }
      })
    )
    inventory.resolve({ data: { canAddCustomPage: true } })
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.perks.putPage).toHaveBeenCalledOnce()
    expect(f.perks.putPage.mock.calls[0][0]).toMatchObject({ name: '[appName] 2' })
  })

  it('preserves the selection cycle across disconnects and a missing session', async () => {
    const f = setup()
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    const id = f.opgg.currentGamePageId
    const qqId = f.qq101.currentGamePage!.id
    f.client.connectionState = 'disconnected'
    f.client.gameflow.phase = null
    await nextTick()
    expect(f.opgg.currentGamePageId).toBe(id)
    f.client.connectionState = 'connected'
    f.client.gameflow.phase = 'ChampSelect'
    f.client.champSelect.session = null
    await nextTick()
    expect(f.opgg.currentGamePageId).toBe(id)
    expect(f.qq101.currentGamePage?.id).toBe(qqId)
    expect(f.store.currentGame.championId).toBe(1)
    f.select(1)
    await nextTick()
    expect(f.opgg.currentGamePageId).toBe(id)
    expect(f.qq101.currentGamePage?.id).toBe(qqId)
    expect(f.store.currentGame.status).toBe('applied')
    expect(f.perks.putPage).toHaveBeenCalledOnce()
    f.store.settings.sourcePreferences = {
      ...f.store.settings.sourcePreferences,
      defaultSource: 'qq101'
    }
    await nextTick()
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })

  it('protects QQ101 managed queries, keeps independent ordinary pages and fixes their order', async () => {
    const f = setup()
    f.select(1, false)
    f.controller.start()
    await vi.waitFor(() => expect(f.qq101.currentGamePage?.view?.mode).toBe('ranked'))
    const managed = f.qq101.currentGamePage!
    await f.qq101.openChampion(1, 'MIDDLE', managed.id)
    const ordinary = f.store.qq101.pages.activeId
    expect(ordinary).not.toBe(managed.id)
    f.qq101.reorder([ordinary, managed.id])
    await f.qq101.updateHero(managed.id, { mode: 'aram_mayhem' })
    await f.qq101.changeHeroMode(managed.id, 'aram_mayhem')
    f.qq101.close(managed.id)
    expect(f.qq101.currentGamePage?.query).toEqual(managed.query)
    expect(f.store.qq101.pages.items[0].id).toBe(managed.id)
    f.select(2, false)
    await nextTick()
    expect(f.store.qq101.pages.activeId).toBe(ordinary)
    expect(f.store.qq101.pages.items.find((page) => page.id === ordinary)).toMatchObject({
      championId: 1
    })
  })

  it.each(['None', 'Lobby', 'PreEndOfGame', 'WaitingForStats', 'EndOfGame'] as const)(
    'clears only managed pages at %s',
    async (phase) => {
      const f = setup()
      f.select(1, false)
      f.controller.start()
      await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
      const managed = f.opgg.currentGamePageId!
      await f.opgg.open(1, managed)
      const ordinary = f.store.opgg.snapshot.activePage!
      f.client.gameflow.phase = phase
      await nextTick()
      expect(f.store.opgg.snapshot.openedPages).toEqual([ordinary])
      expect(f.qq101.currentGamePage).toBeNull()
    }
  )

  it('reconstructs an in-game page for browsing and cancels work on disposal', async () => {
    const f = setup()
    f.client.gameflow.phase = 'InProgress'
    f.client.summoner.me = { puuid: 'self' } as typeof f.client.summoner.me
    f.client.gameflow.session!.gameData.playerChampionSelections = [
      { puuid: 'self', championId: 1 }
    ] as GameflowSession['gameData']['playerChampionSelections']
    f.client.gameflow.session!.gameData.teamOne = [
      { puuid: 'self', selectedPosition: 'middle', championId: 1 }
    ] as GameflowSession['gameData']['teamOne']
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    expect(f.store.currentGame.status).toBe('inGame')
    expect(f.perks.putPage).not.toHaveBeenCalled()
    f.client.gameflow.phase = 'ChampSelect'
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    f.controller.dispose()
    inventory.resolve({ data: { canAddCustomPage: true } })
    await nextTick()
    expect(f.opgg.currentGamePage).toBeNull()
    expect(f.perks.putPage).not.toHaveBeenCalled()
  })
  it('treats system assignment without pick actions as determined, but not a pick intent', async () => {
    const f = setup()
    f.select(1, false)
    f.client.champSelect.session!.myTeam[0].championId = 0
    f.client.champSelect.session!.actions = []
    f.controller.start()
    await nextTick()
    expect(f.opgg.currentGamePage).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()
    expect(f.store.currentGame.status).toBe('waitingChampion')
    const session = f.client.champSelect.session!
    f.client.champSelect.session = { ...session, myTeam: [{ ...session.myTeam[0], championId: 1 }] }
    await vi.waitFor(() => expect(f.store.currentGame.status).toBe('applied'))
    expect(f.perks.putPage).toHaveBeenCalledOnce()
  })

  it('gives an unfinished pick precedence even if an earlier action was completed', async () => {
    const f = setup()
    f.select(1)
    const session = f.client.champSelect.session!
    session.actions[0].push({ ...session.actions[0][0], championId: 0, completed: false })
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    expect(f.store.currentGame.status).toBe('waitingLock')
    expect(f.perks.putPage).not.toHaveBeenCalled()
  })

  it('serializes manual application behind an in-flight read and cancels its automatic writer', async () => {
    const f = setup()
    const inventory = deferred<{ data: { canAddCustomPage: boolean } }>()
    f.perks.getPerkInventory.mockReturnValueOnce(inventory.promise)
    f.select(1)
    f.controller.start()
    await vi.waitFor(() => expect(f.perks.getPerkInventory).toHaveBeenCalledOnce())
    const manual = f.runes.apply(
      {
        primaryStyleId: 8000,
        subStyleId: 8100,
        selectedPerkIds: [...rune.primaryRuneIds, ...rune.secondaryRuneIds, ...rune.statShardIds]
      },
      'Manual priority'
    )
    await nextTick()
    expect(f.perks.getPerkInventory).toHaveBeenCalledOnce()
    expect(f.perks.postPerkPage).not.toHaveBeenCalled()
    inventory.resolve({ data: { canAddCustomPage: true } })
    await manual
    expect(f.store.currentGame.status).toBe('manual')
    expect(f.perks.putPage).toHaveBeenCalledOnce()
    expect(f.perks.putPage.mock.calls[0][0]).toMatchObject({ name: 'Manual priority' })
  })
  it('keeps the automatic page outside the 20 ordinary OP.GG page limit', async () => {
    const f = setup()
    f.select(1, false)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    const managed = f.opgg.currentGamePageId!
    for (let championId = 2; championId <= 21; championId++) {
      await f.opgg.open(championId, managed)
    }
    expect(f.store.opgg.snapshot.openedPages).toHaveLength(21)
    await expect(f.opgg.open(22, managed)).resolves.toBe(false)
    expect(f.opgg.currentGamePageId).toBe(managed)
    f.client.gameflow.phase = 'Lobby'
    await nextTick()
    expect(f.store.opgg.snapshot.openedPages).toHaveLength(20)
  })

  it('uses only the player champion ID to create and focus managed pages', async () => {
    const f = setup()
    f.select(0, false)
    const session = f.client.champSelect.session!
    session.myTeam[0].championPickIntent = 1
    session.actions[0][0].championId = 1
    f.controller.start()
    await nextTick()
    expect(f.store.opgg.snapshot.openedPages).toEqual([])
    expect(f.store.opgg.snapshot.activePage).toBeNull()
    expect(f.store.qq101.pages.items).toEqual([])
    expect(f.store.qq101.pages.activeId).toBe('rankings')
    f.select(-1, false)
    await nextTick()
    expect(f.opgg.currentGamePageId).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()
    f.select(1, false)
    f.client.gameData.champions = {}
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    expect(f.store.opgg.snapshot.openedPages).toEqual([f.opgg.currentGamePageId])
    expect(f.store.opgg.snapshot.activePage).toBe(f.opgg.currentGamePageId)
    expect(f.store.qq101.pages.items.map((page) => page.id)).toEqual([f.qq101.currentGamePage!.id])
    expect(f.store.qq101.pages.activeId).toBe(f.qq101.currentGamePage!.id)
  })
  it('ignores bans and closes managed pages only when the player champion ID is cleared', async () => {
    const f = setup()
    f.select(1, false)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    await vi.waitFor(() => expect(f.qq101.currentGamePage?.view?.mode).toBe('ranked'))
    const opggId = f.opgg.currentGamePageId!
    const qqId = f.qq101.currentGamePage!.id
    await f.opgg.open(2, opggId)
    await f.qq101.openChampion(2, 'MIDDLE', qqId)
    const ordinaryOpgg = f.store.opgg.snapshot.activePage
    const ordinaryQq = f.store.qq101.pages.activeId
    await f.opgg.activate(opggId)
    f.qq101.activate(qqId)
    const session = f.client.champSelect.session!
    f.client.champSelect.session = {
      ...session,
      bans: { myTeamBans: [], theirTeamBans: [1], numBans: 1 }
    }
    await nextTick()
    expect(f.opgg.currentGamePageId).toBe(opggId)
    expect(f.qq101.currentGamePage?.id).toBe(qqId)
    expect(f.store.currentGame.championId).toBe(1)

    f.select(0, false)
    await nextTick()
    expect(f.opgg.currentGamePageId).toBeNull()
    expect(f.qq101.currentGamePage).toBeNull()
    expect(f.store.opgg.snapshot.activePage).toBe(ordinaryOpgg)
    expect(f.store.qq101.pages.activeId).toBe(ordinaryQq)
    f.select(2, false)
    await nextTick()
    expect(f.opgg.currentGamePageId).not.toBe(opggId)
    expect(f.qq101.currentGamePage!.id).not.toBe(qqId)
    expect(f.store.opgg.snapshot.openedPages).toHaveLength(2)
    expect(f.store.qq101.pages.items).toHaveLength(2)
  })

  it('shows the player champion even when it appears in the disabled list', async () => {
    const f = setup()
    f.select(1, false)
    f.controller.start()
    await vi.waitFor(() => expect(f.opgg.currentGamePage?.status).toBe('ready'))
    f.client.champSelect.disabledChampionIds = new Set([1])
    await nextTick()
    expect(f.store.currentGame.status).toBe('waitingLock')
    expect(f.store.currentGame.championId).toBe(1)
    expect(f.opgg.currentGamePage?.query.championId).toBe(1)
    expect(f.qq101.currentGamePage?.championId).toBe(1)
  })
})
