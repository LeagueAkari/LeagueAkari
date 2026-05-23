import { markRaw } from 'vue'

import {
  type LcuOrSgpGameSummary,
  MAIN_SHARD_NAMESPACE,
  type OngoingGameAllData,
  type OngoingGameRendererContext
} from './context'
import { useOngoingGameStore } from './store'

export class OngoingGameStoreEventHandlers {
  constructor(private readonly context: OngoingGameRendererContext) {}

  register() {
    const store = useOngoingGameStore()
    const { ipc } = this.context

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear', () => {
      store.summoner = {}
      store.matchHistory = {}
      store.rankedStats = {}
      store.championMastery = {}
      store.savedInfo = {}
      store.cachedGames = {}
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'clear-player', (puuid: string) => {
      delete store.summoner[puuid]
      delete store.matchHistory[puuid]
      delete store.rankedStats[puuid]
      delete store.championMastery[puuid]
      delete store.savedInfo[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'summoner-removed', (puuid: string) => {
      delete store.summoner[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'ranked-stats-removed', (puuid: string) => {
      delete store.rankedStats[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'champion-mastery-removed', (puuid: string) => {
      delete store.championMastery[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'match-history-removed', (puuid: string) => {
      delete store.matchHistory[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'saved-info-removed', (puuid: string) => {
      delete store.savedInfo[puuid]
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'match-history-loaded', (puuid: string, data) => {
      store.matchHistory[puuid] = markRaw(data)

      const games = data.data as LcuOrSgpGameSummary[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'additional-game-loaded', (gameId: number, data) => {
      store.cachedGames[gameId] = markRaw(data)
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'summoner-loaded', (puuid: string, data) => {
      store.summoner[puuid] = markRaw(data)
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'ranked-stats-loaded', (puuid: string, data) => {
      store.rankedStats[puuid] = markRaw(data)
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'champion-mastery-loaded', (puuid: string, data) => {
      store.championMastery[puuid] = markRaw(data)
    })

    ipc.onEvent(MAIN_SHARD_NAMESPACE, 'saved-info-loaded', (puuid: string, data) => {
      store.savedInfo[puuid] = markRaw(data)
    })
  }

  async loadInitialData(data: OngoingGameAllData) {
    const store = useOngoingGameStore()
    const { championMastery, matchHistory, rankedStats, savedInfo, summoner, additionalGames } =
      data

    store.championMastery = this._toShallowedMarkRaw(championMastery)
    store.matchHistory = this._toShallowedMarkRaw(matchHistory)
    store.rankedStats = this._toShallowedMarkRaw(rankedStats)
    store.savedInfo = this._toShallowedMarkRaw(savedInfo)
    store.summoner = this._toShallowedMarkRaw(summoner)

    Object.values(matchHistory).forEach((entry) => {
      const games = entry.data as LcuOrSgpGameSummary[]
      games.forEach((game) => (store.cachedGames[game.gameId] = markRaw(game)))
    })

    Object.values(additionalGames).forEach((entry) => {
      store.cachedGames[entry.data.gameId] = markRaw(entry.data)
    })
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
}
