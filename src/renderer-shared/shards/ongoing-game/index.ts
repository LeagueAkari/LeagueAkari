import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { markRaw } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { MatchHistoryPlayer, useOngoingGameStore } from './store'

const MAIN_SHARD_NAMESPACE = 'ongoing-game-main'

@Shard(OngoingGameRenderer.id)
export class OngoingGameRenderer implements IAkariShardInitDispose {
  static id = 'ongoing-game-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) readonly _setup: SetupInAppScopeRenderer
  ) {}

  setConcurrency(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'concurrency', value)
  }

  setEnabled(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryLoadCount', value)
  }

  setPremadeTeamThreshold(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'premadeTeamThreshold', value)
  }

  setMatchHistoryUseSgpApi(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryUseSgpApi', value)
  }

  setMatchHistoryTag(value: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'setMatchHistoryTag', value)
  }

  setMatchHistoryTagPreference(value: 'current' | 'all') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'matchHistoryTagPreference', value)
  }

  setGameTimelineLoadCount(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'gameTimelineLoadCount', value)
  }

  setOrderPlayerBy(
    value: 'win-rate' | 'kda' | 'default' | 'akari-score' | 'position' | 'premade-team'
  ) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'orderPlayerBy', value)
  }

  setShowChampionUsage(value: 'recent' | 'mastery' | 'none') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'showChampionUsage', value)
  }

  setShowMatchHistoryItemBorder(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'showMatchHistoryItemBorder', value)
  }

  setAutoRouteWhenGameStarts(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoRouteWhenGameStarts', value)
  }

  setPlayerCardTags(value: object) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'playerCardTags', value)
  }

  reload() {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reload')
  }

  reloadPlayer(puuid: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reloadPlayer', puuid)
  }

  getAll() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAll') as Promise<{
      matchHistory: Record<string, MatchHistoryPlayer>
      summoner: Record<string, SummonerInfo>
      rankedStats: Record<string, RankedStats>
      championMastery: Record<string, Record<number, Mastery>>
      additionalGames: Record<number, any>
      savedInfo: any
    }>
  }

  private _toShallowedMarkRaw<T extends object>(obj: T) {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        acc[key] = markRaw(value)
        return acc
      },
      {} as Record<keyof T, any>
    )
  }

  async onInit() {
    const store = useOngoingGameStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear', () => {
      store.summoner = {}
      store.matchHistory = {}
      store.rankedStats = {}
      store.championMastery = {}
      store.savedInfo = {}
      store.cachedGames = {}
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear-player', (puuid: string) => {
      delete store.summoner[puuid]
      delete store.matchHistory[puuid]
      delete store.rankedStats[puuid]
      delete store.championMastery[puuid]
      delete store.savedInfo[puuid]
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'match-history-loaded', (puuid: string, data) => {
      store.matchHistory[puuid] = markRaw(data)

      const games = data.data as LcuOrSgpGameSummary[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'additional-game-loaded', (gameId: number, data) => {
      store.cachedGames[gameId] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'summoner-loaded', (puuid: string, data) => {
      store.summoner[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'ranked-stats-loaded', (puuid: string, data) => {
      store.rankedStats[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'champion-mastery-loaded', (puuid: string, data) => {
      store.championMastery[puuid] = markRaw(data)
    })

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'saved-info-loaded', (puuid: string, data) => {
      store.savedInfo[puuid] = markRaw(data)
    })

    const { championMastery, matchHistory, rankedStats, savedInfo, summoner, additionalGames } =
      await this.getAll()
    store.championMastery = this._toShallowedMarkRaw(championMastery)
    store.matchHistory = this._toShallowedMarkRaw(matchHistory)
    store.rankedStats = this._toShallowedMarkRaw(rankedStats)
    store.savedInfo = this._toShallowedMarkRaw(savedInfo)
    store.summoner = this._toShallowedMarkRaw(summoner)

    Object.values(matchHistory).forEach((data) => {
      const games = data.data as LcuOrSgpGameSummary[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    Object.values(additionalGames).forEach((data) => {
      store.cachedGames[data.data.gameId] = markRaw(data.data)
    })
  }

  async onDispose() {}
}
