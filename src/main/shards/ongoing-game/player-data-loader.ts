import { OngoingGameSimplifiedChampMastery } from '@shared/types/shards/ongoing-game'
import { isAbortError } from '@shared/utils/queue-keeper'
import { runInAction } from 'mobx'

import {
  ONGOING_GAME_LOADING_PRIORITY,
  ONGOING_GAME_MAIN_NAMESPACE,
  type OngoingGameMainContext
} from './context'
import type { OngoingGameMatchHistoryLoader } from './match-history-loader'

export class OngoingGamePlayerDataLoader {
  constructor(
    private readonly _context: OngoingGameMainContext,
    private readonly _matchHistory: OngoingGameMatchHistoryLoader
  ) {}

  watch() {
    const { mobxUtils, state } = this._context

    mobxUtils.reaction(
      () => state.teams,
      (teams) => {
        const puuids = Object.values(teams).flat()

        this.updateSummoners(puuids)
        this.updateRankedStats(puuids)
        this.updateSavedInfo(puuids)
        this.updateChampionMasteries(puuids)
      },
      { delay: 300, fireImmediately: true }
    )
  }

  updateSummoners(puuids: string[], force = false) {
    const { ipc, queueKeeper, state } = this._context

    for (const puuid of Object.keys(state.summoner)) {
      if (!puuids.includes(puuid)) {
        delete state.summoner[puuid]
        delete state.summonerLoadingState[puuid]

        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'summoner-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      queueKeeper.cancelByTags([puuid, 'summoner'], 'and')
      this.loadSummoner(puuid, { force })
    }
  }

  updateRankedStats(puuids: string[], force = false) {
    const { ipc, queueKeeper, state } = this._context

    for (const puuid of Object.keys(state.rankedStats)) {
      if (!puuids.includes(puuid)) {
        delete state.rankedStats[puuid]
        delete state.rankedStatsLoadingState[puuid]

        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'ranked-stats-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      queueKeeper.cancelByTags([puuid, 'ranked-stats'], 'and')
      this.loadRankedStats(puuid, { force })
    }
  }

  updateSavedInfo(puuids: string[], force = false) {
    const { ipc, queueKeeper, state } = this._context

    for (const puuid of Object.keys(state.savedInfo)) {
      if (!puuids.includes(puuid)) {
        delete state.savedInfo[puuid]

        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'saved-info-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      queueKeeper.cancelByTags([puuid, 'saved-info'], 'and')
      this.loadSavedInfo(puuid, { force })
    }
  }

  updateChampionMasteries(puuids: string[], force = false) {
    const { ipc, queueKeeper, state } = this._context

    for (const puuid of Object.keys(state.championMastery)) {
      if (!puuids.includes(puuid)) {
        delete state.championMastery[puuid]
        delete state.championMasteryLoadingState[puuid]

        ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'champion-mastery-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      queueKeeper.cancelByTags([puuid, 'champion-mastery'], 'and')
      this.loadChampionMastery(puuid, { force })
    }
  }

  reloadPlayer(puuid: string) {
    this.loadSummoner(puuid, { force: true })
    this.loadRankedStats(puuid, { force: true })
    this.loadSavedInfo(puuid, { force: true })
    this.loadChampionMastery(puuid, { force: true })
  }

  async loadSummoner(puuid: string, options: { force?: boolean; isAdditional?: boolean } = {}) {
    const { force, isAdditional } = options
    const { ipc, leagueClient, logger, queueKeeper, state } = this._context

    if (!force && state.summoner[puuid]) {
      logger.info('Summoner info already exists', puuid)
      return
    }

    if (queueKeeper.hasTask(`summoner:${puuid}`)) {
      logger.debug('Summoner already in queue', puuid)
      return
    }

    const tags = [puuid, 'summoner']

    if (isAdditional) {
      tags.push('additional-summoner')
    }

    try {
      const { data } = await queueKeeper.add(
        'misc',
        `summoner:${puuid}`,
        () => leagueClient.api.summoner.getSummonerByPuuid(puuid),
        {
          priority: ONGOING_GAME_LOADING_PRIORITY.SUMMONER,
          tags
        }
      )

      runInAction(() => (state.summoner[puuid] = data))
      ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'summoner-loaded', puuid, data)

      logger.info('Load summoner info completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        logger.info('Summoner info loading aborted', puuid)
        return
      }

      logger.warn('Error loading summoner info', error, puuid)
    }
  }

  async loadSavedInfo(puuid: string, options: { force?: boolean } = {}) {
    const { leagueClient, logger, queueKeeper, savedPlayer, state } = this._context

    if (!leagueClient.state.auth || !leagueClient.data.summoner.me) {
      return
    }

    const query = {
      puuid,
      selfPuuid: leagueClient.data.summoner.me.puuid,
      region: leagueClient.state.auth.region,
      rsoPlatformId: leagueClient.state.auth.rsoPlatformId
    }

    const { force } = options

    if (!force && state.savedInfo[puuid]) {
      return
    }

    if (queueKeeper.hasTask(`saved-info:${puuid}`)) {
      logger.debug('Saved info already in queue', puuid)
      return
    }

    try {
      const data = await queueKeeper.add(
        'misc',
        `saved-info:${puuid}`,
        () => savedPlayer.querySavedPlayerWithGames(query),
        {
          priority: ONGOING_GAME_LOADING_PRIORITY.SAVED_INFO,
          tags: [puuid, 'saved-info']
        }
      )

      if (!data) {
        return
      }

      this._matchHistory.loadAdditionalGame(
        data.encounteredGames.data.map((c) => c.gameId),
        {
          force,
          apiSource: state.apiShouldUse
        }
      )

      data.tags.forEach((t) => {
        this.loadSummoner(t.selfPuuid, { force })
      })

      runInAction(() => (state.savedInfo[puuid] = data))
      this._context.ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'saved-info-loaded', puuid, data)

      logger.info('Load saved info completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        logger.info('Saved info loading aborted', puuid)
        return
      }

      logger.warn('Error loading saved info', error, puuid)
    }
  }

  async loadRankedStats(puuid: string, options: { force?: boolean } = {}) {
    const { force } = options
    const { ipc, leagueClient, logger, queueKeeper, state } = this._context

    if (!force && state.rankedStats[puuid]) {
      logger.debug('Ranked stats already exists', puuid)
      return
    }

    if (queueKeeper.hasTask(`ranked-stats:${puuid}`)) {
      logger.debug('Ranked stats already in queue', puuid)
      return
    }

    try {
      const { data } = await queueKeeper.add(
        'misc',
        `ranked-stats:${puuid}`,
        () => leagueClient.api.ranked.getRankedStats(puuid),
        {
          priority: ONGOING_GAME_LOADING_PRIORITY.RANKED_STATS,
          tags: [puuid, 'ranked-stats']
        }
      )

      runInAction(() => (state.rankedStats[puuid] = data))
      ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'ranked-stats-loaded', puuid, data)

      logger.info('Load ranked stats completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        logger.info('Ranked stats loading aborted', puuid)
        return
      }

      logger.warn('Error loading ranked stats', error, puuid)
    }
  }

  async loadChampionMastery(puuid: string, options: { force?: boolean } = {}) {
    const { force } = options
    const { ipc, leagueClient, logger, queueKeeper, state } = this._context

    if (!force && state.championMastery[puuid]) {
      logger.debug('Champion mastery already exists', puuid)
      return
    }

    if (queueKeeper.hasTask(`champion-mastery:${puuid}`)) {
      logger.debug('Champion mastery already in queue', puuid)
      return
    }

    try {
      const { data } = await queueKeeper.add(
        'misc',
        `champion-mastery:${puuid}`,
        () => leagueClient.api.championMastery.getPlayerChampionMastery(puuid),
        {
          priority: ONGOING_GAME_LOADING_PRIORITY.CHAMPION_MASTERY,
          tags: [puuid, 'champion-mastery']
        }
      )

      const simplifiedMastery = data
        .map((m) => ({
          championId: m.championId,
          championLevel: m.championLevel,
          championPoints: m.championPoints,
          championSeasonMilestone: m.championSeasonMilestone,
          highestGrade: m.highestGrade,
          lastPlayTime: m.lastPlayTime
        }))
        .reduce(
          (obj, cur) => {
            obj[cur.championId] = cur
            return obj
          },
          {} as Record<number, OngoingGameSimplifiedChampMastery>
        )

      runInAction(() => (state.championMastery[puuid] = simplifiedMastery))
      ipc.sendEvent(
        ONGOING_GAME_MAIN_NAMESPACE,
        'champion-mastery-loaded',
        puuid,
        simplifiedMastery
      )

      logger.info('Load champion mastery completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        logger.info('Champion mastery loading aborted', puuid)
        return
      }

      logger.warn('Error loading champion mastery', error, puuid)
    }
  }
}
