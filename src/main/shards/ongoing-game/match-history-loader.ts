import {
  LcuGameSummary,
  LcuGameTimeline,
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary,
  SgpGameDetails,
  SgpGameSummary
} from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { isAbortError } from '@shared/utils/queue-keeper'
import { comparer, computed, runInAction } from 'mobx'
import LRUMap from 'quick-lru'

import {
  ONGOING_GAME_LOADING_PRIORITY,
  ONGOING_GAME_MAIN_NAMESPACE,
  type OngoingGameMainContext
} from './context'

export class OngoingGameMatchHistoryLoader {
  private readonly _gameSummaryLruMap = new LRUMap<string, LcuOrSgpGameSummary>({
    maxSize: 256
  })

  private readonly _gameDetailsLruMap = new LRUMap<string, LcuOrSgpGameDetails>({
    maxSize: 256
  })

  constructor(private readonly _context: OngoingGameMainContext) {}

  watch() {
    const { leagueClient, logger, mobxUtils, settings, sgp, state } = this._context
    const currentQueueTagInfo = computed(() => {
      if (state.draft) {
        if (state.draft.queueId === 0 || state.draft.queueId === -1) {
          return null
        }

        return {
          queueId: state.draft.queueId,
          from: 'draft'
        }
      }

      if (leagueClient.data.lobby.lobby) {
        return {
          queueId: leagueClient.data.lobby.lobby.gameConfig.queueId,
          from: 'lobby'
        }
      }

      if (leagueClient.data.gameflow.session) {
        if (
          leagueClient.data.gameflow.session.gameData.queue.id === 0 ||
          leagueClient.data.gameflow.session.gameData.queue.id === -1
        ) {
          return null
        }

        return {
          queueId: leagueClient.data.gameflow.session.gameData.queue.id,
          from: 'gameflow-session'
        }
      }

      return null
    })

    mobxUtils.reaction(
      () => ({
        teams: state.teams,
        apiShouldUse: state.apiShouldUse,
        sgpTokenReady: sgp.state.isTokenReady,
        count: settings.matchHistoryLoadCount,
        params: state.matchHistoryTagParams
      }),
      ({ count, params, apiShouldUse, sgpTokenReady }) => {
        if (apiShouldUse === 'sgp' && !sgpTokenReady) {
          return
        }

        const puuids = Object.values(state.teams).flat()

        this.updateMatchHistories(
          puuids,
          { startIndex: 0, count, ...params },
          apiShouldUse as 'sgp' | 'lcu'
        )
      },
      { delay: 300, equals: comparer.structural, fireImmediately: true }
    )

    mobxUtils.reaction(
      () => ({
        currentQueueTagInfo: currentQueueTagInfo.get(),
        matchHistoryTagPreference: settings.matchHistoryTagPreference
      }),
      ({ currentQueueTagInfo, matchHistoryTagPreference }) => {
        logger.info('Setting match history tag params', {
          currentQueueTagInfo,
          matchHistoryTagPreference
        })

        if (!currentQueueTagInfo) {
          state.setMatchHistoryTagParams({ tag: undefined })
          return
        }

        state.setMatchHistoryTagParams({
          tag:
            currentQueueTagInfo && matchHistoryTagPreference === 'current'
              ? `q_${currentQueueTagInfo.queueId}`
              : undefined
        })
      },
      { fireImmediately: true, equals: comparer.structural }
    )

    mobxUtils.reaction(
      () =>
        ({
          apiSource: state.apiShouldUse,
          gameIds: Object.values(state.matchHistory).flatMap((m) =>
            m.data.map((g) => g.gameId).slice(0, settings.gameDetailsLoadCount)
          )
        }) as const,
      ({ apiSource, gameIds }) => {
        const whitelistGameIds = new Set<number>(gameIds)

        for (const m of Object.values(state.gameDetails)) {
          if (!whitelistGameIds.has(m.gameId)) {
            delete state.gameDetails[m.gameId]
            this._context.queueKeeper.cancelByTags([m.gameId.toString(), 'game-details'], 'and')
            this._context.ipc.sendEvent(
              ONGOING_GAME_MAIN_NAMESPACE,
              'game-details-removed',
              m.gameId
            )
          }
        }

        this.loadGameDetails(gameIds, { apiSource })
      },
      { delay: 300, equals: comparer.structural, fireImmediately: true }
    )
  }

  updateMatchHistories(
    puuids: string[],
    params: MatchHistoryQueryParams,
    apiSource: 'sgp' | 'lcu',
    force = false
  ) {
    const { ipc, queueKeeper, state } = this._context

    for (const puuid of Object.keys(state.matchHistory)) {
      if (!puuids.includes(puuid)) {
        delete state.matchHistory[puuid]
        delete state.matchHistoryLoadingState[puuid]

        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'match-history-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      queueKeeper.cancelByTags([puuid, 'match-history'], 'and')
      this.loadMatchHistory(puuid, { params, force, apiSource })
    }
  }

  async loadGameDetails(
    gameIds: number[],
    options: {
      force?: boolean
      apiSource: 'sgp' | 'lcu'
      priority?: number
    } = { apiSource: 'lcu' }
  ) {
    const { force, apiSource, priority } = options
    const { ipc, leagueClient, logger, queueKeeper, sgp, state } = this._context

    const loadGameDetails = async (gameId: number) => {
      const current = state.gameDetails[gameId]

      if (current && !force && current.source === apiSource) {
        logger.debug('Game timeline query condition not changed, skip', gameId)
        return
      }

      if (apiSource === 'sgp') {
        const cached = this._gameDetailsLruMap.get(`sgp:${gameId}`)

        if (cached) {
          logger.info('Game details hit cache', 'sgp', gameId)
          runInAction(() => (state.gameDetails[gameId] = cached))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'game-details-loaded', gameId, cached)
          return
        }

        if (queueKeeper.hasTask(`sgp-game-details:${gameId}`)) {
          logger.debug('Game details already in queue', 'sgp', gameId)
          return
        }

        try {
          const { data } = await queueKeeper.add(
            'match-history',
            `sgp-game-details:${gameId}`,
            () => sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId),
            {
              priority: priority ?? ONGOING_GAME_LOADING_PRIORITY.GAME_DETAILS,
              tags: [gameId.toString(), 'game-details', 'sgp']
            }
          )

          logger.info('Game details loaded: SGP', gameId)

          const toBeLoaded = { data, source: 'sgp', gameId } satisfies SgpGameDetails

          this._gameDetailsLruMap.set(`sgp:${gameId}`, toBeLoaded)
          runInAction(() => (state.gameDetails[gameId] = toBeLoaded))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'game-details-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            logger.info('Game details loading aborted', gameId)
            return
          }

          logger.warn('Error loading game details', error, gameId)
        }
      } else {
        const cached = this._gameDetailsLruMap.get(`lcu:${gameId}`)
        if (cached) {
          logger.info('Game details hit cache', 'lcu', gameId)
          runInAction(() => (state.gameDetails[gameId] = cached))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'game-details-loaded', gameId, cached)
          return
        }

        if (queueKeeper.hasTask(`lcu-game-details:${gameId}`)) {
          logger.debug('Game details already in queue', 'lcu', gameId)
          return
        }

        try {
          const { data } = await queueKeeper.add(
            'misc',
            `lcu-game-details:${gameId}`,
            () => leagueClient.api.matchHistory.getTimeline(gameId),
            {
              priority: priority ?? ONGOING_GAME_LOADING_PRIORITY.GAME_DETAILS,
              tags: [gameId.toString(), 'game-details', 'lcu']
            }
          )

          logger.info('Game details loaded: LCU', gameId)

          const toBeLoaded = { data, source: 'lcu', gameId } satisfies LcuGameTimeline

          this._gameDetailsLruMap.set(`lcu:${gameId}`, toBeLoaded)
          runInAction(() => (state.gameDetails[gameId] = toBeLoaded))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'game-details-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            logger.info('Game details loading aborted', gameId)
            return
          }

          logger.warn('Error loading game details', error, gameId)
        }
      }
    }

    await Promise.allSettled(gameIds.map((g) => loadGameDetails(g)))
  }

  async loadAdditionalGame(
    gameIds: number[],
    options: {
      force?: boolean
      apiSource: 'sgp' | 'lcu'
    } = { apiSource: 'lcu' }
  ) {
    const { force, apiSource } = options
    const { ipc, leagueClient, logger, queueKeeper, sgp, state } = this._context

    const loadGame = async (gameId: number) => {
      const current = state.additionalGame[gameId]

      if (current && !force && current.source === apiSource) {
        logger.debug('Additional game query condition not changed, skip', gameId)
        return
      }

      if (apiSource === 'sgp') {
        const cached = this._gameSummaryLruMap.get(`sgp:${gameId}`)

        if (cached) {
          logger.info('Game details hit cache', 'sgp', gameId)
          runInAction(() => (state.additionalGame[gameId] = cached))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'additional-game-loaded', gameId, cached)
          return
        }

        if (queueKeeper.hasTask(`sgp-additional-game-summary:${gameId}`)) {
          logger.debug('Additional game already in queue', 'sgp', gameId)
          return
        }

        try {
          logger.debug('Load additional game: SGP API', gameId)

          const { data } = await queueKeeper.add(
            'misc',
            `sgp-additional-game-summary:${gameId}`,
            () => sgp.api.matchHistoryQuery.getGameSummaryByGameId(gameId),
            {
              priority: Infinity,
              tags: [gameId.toString(), 'additional-game-summary', 'sgp']
            }
          )

          logger.info('Additional game loaded: SGP', gameId)

          const toBeLoaded = { data, source: 'sgp', gameId } satisfies SgpGameSummary

          this._gameSummaryLruMap.set(`sgp:${gameId}`, toBeLoaded)
          runInAction(() => (state.additionalGame[gameId] = toBeLoaded))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'additional-game-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            logger.info('Additional game loading aborted', gameId)
            return
          }

          logger.warn('Error loading additional game', error, gameId)
        }
      } else {
        const cached = this._gameSummaryLruMap.get(`lcu:${gameId}`)

        if (cached) {
          logger.info('Additional game hit cache', 'lcu', gameId)
          runInAction(() => (state.additionalGame[gameId] = cached))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'additional-game-loaded', gameId, cached)
          return
        }

        if (queueKeeper.hasTask(`lcu-additional-game-summary:${gameId}`)) {
          logger.debug('Additional game already in queue', 'lcu', gameId)
          return
        }

        try {
          logger.debug('Load additional game: LCU API', gameId)

          const { data } = await queueKeeper.add(
            'misc',
            `lcu-additional-game-summary:${gameId}`,
            () => leagueClient.api.matchHistory.getGame(gameId),
            {
              priority: Infinity,
              tags: [gameId.toString(), 'additional-game-summary', 'lcu']
            }
          )

          logger.info('Additional game loaded: LCU', gameId)

          const toBeLoaded = { data, source: 'lcu', gameId } satisfies LcuGameSummary

          this._gameSummaryLruMap.set(`lcu:${gameId}`, toBeLoaded)
          runInAction(() => (state.additionalGame[gameId] = toBeLoaded))
          ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'additional-game-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            logger.info('Additional game loading aborted', gameId)
            return
          }

          logger.warn('Error loading additional game', error, gameId)
        }
      }
    }

    await Promise.allSettled(gameIds.map((g) => loadGame(g)))
  }

  async loadMatchHistory(
    puuid: string,
    options: {
      params: MatchHistoryQueryParams
      force?: boolean
      apiSource: 'sgp' | 'lcu'
    } = { params: { startIndex: 0, count: 20 }, apiSource: 'lcu' }
  ) {
    const { params, force, apiSource } = options
    const { ipc, leagueClient, logger, queueKeeper, sgp, state } = this._context

    const current = state.matchHistory[puuid]

    if (current && !force) {
      const sameSgpQuery = () =>
        apiSource === 'sgp' &&
        current.source === 'sgp' &&
        current.params.tag === params.tag &&
        current.params.tagsQueryType === params.tagsQueryType &&
        current.params.startIndex === params.startIndex &&
        current.params.count === params.count

      const sameLcuQuery = () =>
        apiSource === 'lcu' &&
        current.source === 'lcu' &&
        current.params.startIndex === params.startIndex &&
        current.params.count === params.count

      if (sameSgpQuery()) {
        logger.debug('Player match history query condition not changed, skip (SGP)', puuid)
        return
      }

      if (sameLcuQuery()) {
        logger.debug('Player match history query condition not changed, skip (LCU)', puuid)
        return
      }
    }

    if (apiSource === 'sgp') {
      try {
        if (queueKeeper.hasTask(`sgp-match-history:${puuid}`)) {
          logger.debug('Player match history already in queue', 'sgp', puuid)
          return
        }

        state.setMatchHistoryLoadingState(puuid, 'loading')

        const { data } = await queueKeeper.add(
          'match-history',
          `sgp-match-history:${puuid}`,
          () => sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(puuid, params),
          {
            priority: ONGOING_GAME_LOADING_PRIORITY.MATCH_HISTORY,
            tags: [puuid, 'match-history', 'sgp']
          }
        )

        const filtered = data.games.filter((g) => g.json)

        const toBeLoaded = {
          data: filtered.map(
            (g) => ({ source: 'sgp', data: g, gameId: g.json.gameId }) satisfies SgpGameSummary
          ),
          params,
          source: 'sgp' as const
        }

        runInAction(() => (state.matchHistory[puuid] = toBeLoaded))
        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'match-history-loaded', puuid, toBeLoaded)
        state.setMatchHistoryLoadingState(puuid, 'loaded')

        logger.info('Load player match history completed: SGP API', puuid)
      } catch (error) {
        if (isAbortError(error)) {
          logger.info('Player match history loading aborted', puuid)
          return
        }

        logger.warn('Error loading player match history', error, puuid)
        state.setMatchHistoryLoadingState(puuid, 'error')
      }
    } else {
      try {
        if (queueKeeper.hasTask(`lcu-match-history:${puuid}`)) {
          logger.debug('Player match history already in queue', 'lcu', puuid)
          return
        }

        state.setMatchHistoryLoadingState(puuid, 'loading')

        const { data } = await queueKeeper.add(
          'match-history',
          `lcu-match-history:${puuid}`,
          () =>
            leagueClient.api.matchHistory.getMatchHistory(
              puuid,
              params.startIndex ?? 0,
              (params.count ?? 20) - 1
            ),
          {
            priority: ONGOING_GAME_LOADING_PRIORITY.MATCH_HISTORY,
            tags: [puuid, 'match-history', 'lcu']
          }
        )

        const detailedGameMap: Record<number, LcuGameSummary> = {}
        const completeGame = async (gameId: number) => {
          const cached = this._gameSummaryLruMap.get(`lcu:${gameId}`) as LcuGameSummary | undefined

          if (cached) {
            detailedGameMap[gameId] = cached
            return
          }

          if (queueKeeper.hasTask(`lcu-game-summary:${gameId}`)) {
            logger.debug('Game summary already in queue', 'lcu', gameId)
            return
          }

          try {
            const { data } = await queueKeeper.add(
              'misc',
              `lcu-game-summary:${gameId}`,
              () => leagueClient.api.matchHistory.getGame(gameId),
              {
                priority: Infinity,
                tags: [puuid, 'game-summary', 'lcu', `part-of:${gameId}`]
              }
            )

            this._gameSummaryLruMap.set(`lcu:${gameId}`, {
              gameId,
              source: 'lcu',
              data
            } satisfies LcuGameSummary)

            detailedGameMap[gameId] = { gameId, source: 'lcu', data }
          } catch (error) {
            if (isAbortError(error)) {
              logger.info('Game summary loading aborted', puuid, gameId)
              return
            }

            logger.warn('Error loading game summary', error, puuid, gameId)
          }
        }

        await Promise.allSettled(data.games.games.map((g) => completeGame(g.gameId)))

        const games = data.games.games.map(
          (g) => detailedGameMap[g.gameId] || { gameId: g.gameId, source: 'lcu', data: g }
        )

        const toBeLoaded = {
          data: games,
          params,
          source: 'lcu' as 'sgp' | 'lcu'
        }

        runInAction(() => (state.matchHistory[puuid] = toBeLoaded))
        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'match-history-loaded', puuid, toBeLoaded)
        state.setMatchHistoryLoadingState(puuid, 'loaded')

        logger.info('Load player match history completed: LCU API', puuid)
      } catch (error) {
        if (isAbortError(error)) {
          logger.info('Player match history loading aborted', puuid)
          return
        }

        logger.warn('Error loading player match history', error, puuid)
        state.setMatchHistoryLoadingState(puuid, 'error')
      }
    }
  }
}
