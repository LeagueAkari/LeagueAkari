import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { EMPTY_PUUID } from '@shared/constants/common'
import {
  JunglePathingAnalysis,
  analyzeJunglePathing,
  filterJungleGames
} from '@shared/data-adapter/analysis/jungle'
import {
  MatchHistoryGamesAnalysisAll,
  analyzeMatchHistory
} from '@shared/data-adapter/analysis/players'
import {
  MatchHistoryGamesAnalysisTeamSide,
  analyzeTeamMatchHistory
} from '@shared/data-adapter/analysis/teams'
import { toIdentities } from '@shared/data-adapter/match-history/toIdentities'
import {
  LcuGameSummary,
  LcuGameTimeline,
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary,
  SgpGameDetails,
  SgpGameSummary
} from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { AdditionalResult } from '@shared/types/shards/ongoing-game'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'
import { ParsedRole, parseSelectedRole } from '@shared/utils/ranked'
import {
  calculateTogetherTimes,
  mergeOverlappingSets,
  removeSubsets
} from '@shared/utils/team-up-calc'
import { isAxiosError } from 'axios'
import _ from 'lodash'
import { comparer, computed, runInAction, toJS } from 'mobx'
import LRUMap from 'quick-lru'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SavedPlayerMain } from '../saved-player'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SgpMain } from '../sgp'
import { memberMerge } from './member-merge'
import { OngoingGameSettings, OngoingGameState } from './state'

/**
 * 用于游戏过程中的对局分析, 包括在此期间的战绩查询, 计算等
 */
@Shard(OngoingGameMain.id)
export class OngoingGameMain implements IAkariShardInitDispose {
  static id = 'ongoing-game-main'

  static LOADING_PRIORITY = {
    ADDITIONAL_INFO: 7,
    ADDITIONAL_SUMMONER: -1,
    SUMMONER: 6,
    MATCH_HISTORY: 5,
    SAVED_INFO: 4,
    RANKED_STATS: 3,
    CHAMPION_MASTERY: 2,
    ADDITIONAL_GAME: 2,
    GAME_DETAILS: 1
  }

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  public readonly settings: OngoingGameSettings
  public readonly state: OngoingGameState

  private readonly _queueKeeper = new QueueKeeper([{ id: 'match-history' }, { id: 'misc' }])

  private _gameSummaryLruMap = new LRUMap<string, LcuOrSgpGameSummary>({
    maxSize: 256
  })

  private _gameDetailsLruMap = new LRUMap<string, LcuOrSgpGameDetails>({
    maxSize: 256
  })

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _sgp: SgpMain,
    private readonly _saved: SavedPlayerMain,
    private readonly _appCommon: AppCommonMain,
    private readonly _rc: RemoteConfigMain
  ) {
    this.settings = new OngoingGameSettings()
    this._log = _loggerFactory.create(OngoingGameMain.id)
    this._setting = _settingFactory.register(
      OngoingGameMain.id,
      {
        concurrency: { default: this.settings.concurrency },
        enabled: { default: this.settings.enabled },
        matchHistoryLoadCount: { default: this.settings.matchHistoryLoadCount },
        matchHistoryTagPreference: { default: this.settings.matchHistoryTagPreference },
        gameDetailsLoadCount: { default: this.settings.matchHistoryLoadCount },
        orderPlayerBy: { default: this.settings.orderPlayerBy },
        showChampionUsage: { default: this.settings.showChampionUsage },
        showMatchHistoryItemBorder: { default: this.settings.showMatchHistoryItemBorder },
        autoRouteWhenGameStarts: { default: this.settings.autoRouteWhenGameStarts },
        playerCardTags: { default: this.settings.playerCardTags },
        queryInLobbyPhase: { default: this.settings.queryInLobbyPhase },
        premadeTeamInferMatchCountThreshold: {
          default: this.settings.premadeTeamInferMatchCountThreshold
        }
      },
      this.settings
    )
    this.state = new OngoingGameState(
      this._lc.data,
      this._appCommon,
      this._sgp,
      this.settings,
      this._rc
    )
  }

  private async _handleState() {
    await this._setting.applyToState()
    this._mobx.propSync(OngoingGameMain.id, 'settings', this.settings, [
      'concurrency',
      'enabled',
      'matchHistoryLoadCount',
      'matchHistoryTagPreference',
      'gameDetailsLoadCount',
      'orderPlayerBy',
      'showChampionUsage',
      'showMatchHistoryItemBorder',
      'autoRouteWhenGameStarts',
      'playerCardTags',
      'queryInLobbyPhase',
      'premadeTeamInferMatchCountThreshold'
    ])

    this._mobx.propSync(OngoingGameMain.id, 'state', this.state, [
      'championSelections',
      'positionAssignments',
      'playerStats',
      'queryStage',
      'teams',
      'matchHistoryTag',
      'matchHistoryLoadingState',
      'summonerLoadingState',
      'savedInfoLoadingState',
      'rankedStatsLoadingState',
      'championMasteryLoadingState',
      'teamParticipantGroups',
      'matchHistoryTagParams',
      'draft',
      'additional',
      'calculatedPremadeTeamMap',
      'inferredPremadeTeams',
      'jungleAnalysis'
    ])

    // 便于精准订阅
    this._mobx.propSync(OngoingGameMain.id, 'additional', this.state, ['additional'])
  }

  async onInit() {
    await this._handleState()

    this._handleConcurrencyChange()
    this._handleIpcCall()
    this._handleCalculation()
    this._handleEndOfGameSave()
    this._handleRemindTaggedPlayers()
    this._handleLoad()
    this._handleInformationCompletion()

    this._setting.onChange('matchHistoryLoadCount', async (value, { setter }) => {
      if (value >= 1 && value <= 200) {
        await setter(value)
      }

      this._setting.set('gameDetailsLoadCount', Math.min(value, this.settings.gameDetailsLoadCount))
    })

    this._setting.onChange('gameDetailsLoadCount', async (value, { setter }) => {
      if (value >= 0 && value <= this.settings.matchHistoryLoadCount) {
        await setter(value)
        return
      }

      await setter(this.settings.matchHistoryLoadCount)
    })
  }

  private _handleConcurrencyChange() {
    this._mobx.reaction(
      () => this.settings.concurrency,
      (concurrency) => {
        this._queueKeeper.setConcurrency('match-history', concurrency)
        this._queueKeeper.setConcurrency('misc', concurrency)
      },
      { fireImmediately: true }
    )
  }

  private _handleLoad() {
    // summoner / ranked stats / saved info / champion mastery
    this._mobx.reaction(
      () => this.state.teams,
      (teams) => {
        const puuids = Object.values(teams).flat()

        this._updateSummoners(puuids)
        this._updateRankedStats(puuids)
        this._updateSavedInfo(puuids)
        this._updateChampionMasteries(puuids)
      },
      { delay: 500, fireImmediately: true } // gameflow 的队伍信息可能是上局残留的，等待 lc 将其刷新，通常很快，这里留出 500 ms，下同
    )

    const currentQueueTagInfo = computed(() => {
      if (this._lc.data.lobby.lobby) {
        return {
          queueId: this._lc.data.lobby.lobby.gameConfig.queueId,
          from: 'lobby' // 一个无关字段让其保持变化
        }
      }

      if (this._lc.data.gameflow.session) {
        if (
          this._lc.data.gameflow.session.gameData.queue.id === 0 ||
          this._lc.data.gameflow.session.gameData.queue.id === -1
        ) {
          return null
        }

        return {
          queueId: this._lc.data.gameflow.session.gameData.queue.id,
          from: 'gameflow-session'
        }
      }

      return null
    })

    // match history
    this._mobx.reaction(
      () => ({
        teams: this.state.teams,
        apiShouldUse: this.state.apiShouldUse,
        sgpTokenReady: this._sgp.state.isTokenReady,
        count: this.settings.matchHistoryLoadCount,
        params: this.state.matchHistoryTagParams
      }),
      ({ count, params, apiShouldUse, sgpTokenReady }) => {
        // wait for sgp token ready if needed
        if (apiShouldUse === 'sgp' && !sgpTokenReady) {
          return
        }

        const puuids = Object.values(this.state.teams).flat()

        this._updateMatchHistories(
          puuids,
          { startIndex: 0, count, ...params },
          apiShouldUse as 'sgp' | 'lcu'
        )
      },
      { delay: 500 /* important! */, equals: comparer.structural, fireImmediately: true }
    )

    this._mobx.reaction(
      () => ({
        currentQueueTagInfo: currentQueueTagInfo.get(),
        matchHistoryTagPreference: this.settings.matchHistoryTagPreference
      }),
      ({ currentQueueTagInfo, matchHistoryTagPreference }) => {
        this._log.info('Setting match history tag params', {
          currentQueueTagInfo,
          matchHistoryTagPreference
        })

        if (!currentQueueTagInfo) {
          this.state.setMatchHistoryTagParams({ tag: undefined })
          return
        }

        this.state.setMatchHistoryTagParams({
          tag:
            currentQueueTagInfo && matchHistoryTagPreference === 'current'
              ? `q_${currentQueueTagInfo.queueId}`
              : undefined
        })
      },
      { fireImmediately: true, equals: comparer.structural }
    )

    this._mobx.reaction(
      () => this.state.queryStage.phase === 'unavailable',
      (isUnavailable) => {
        if (isUnavailable) {
          this._log.info('Clearing ongoing game state')
          this._queueKeeper.cancelAll()
          this.state.clear()
          this._ipc.sendEvent(OngoingGameMain.id, 'clear')
          return
        }
      },
      { equals: comparer.shallow }
    )
  }

  /**
   * 更新所有涉及到的玩家的数据
   */
  private _updateSummoners(puuids: string[], force = false) {
    for (const puuid of Object.keys(this.state.summoner)) {
      if (!puuids.includes(puuid)) {
        delete this.state.summoner[puuid]
        delete this.state.summonerLoadingState[puuid]

        this._ipc.sendEvent(OngoingGameMain.id, 'summoner-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      this._queueKeeper.cancelByTags([puuid, 'summoner'], 'and')
      this._loadSummoner(puuid, { force })
    }
  }

  private _updateRankedStats(puuids: string[], force = false) {
    for (const puuid of Object.keys(this.state.rankedStats)) {
      if (!puuids.includes(puuid)) {
        delete this.state.rankedStats[puuid]
        delete this.state.rankedStatsLoadingState[puuid]

        this._ipc.sendEvent(OngoingGameMain.id, 'ranked-stats-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      this._queueKeeper.cancelByTags([puuid, 'ranked-stats'], 'and')
      this._loadRankedStats(puuid, { force })
    }
  }

  private _updateSavedInfo(puuids: string[], force = false) {
    for (const puuid of Object.keys(this.state.savedInfo)) {
      if (!puuids.includes(puuid)) {
        delete this.state.savedInfo[puuid]

        this._ipc.sendEvent(OngoingGameMain.id, 'saved-info-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      this._queueKeeper.cancelByTags([puuid, 'saved-info'], 'and')
      this._loadSavedInfo(puuid, { force })
    }
  }

  private _updateChampionMasteries(puuids: string[], force = false) {
    for (const puuid of Object.keys(this.state.championMastery)) {
      if (!puuids.includes(puuid)) {
        delete this.state.championMastery[puuid]
        delete this.state.championMasteryLoadingState[puuid]

        this._ipc.sendEvent(OngoingGameMain.id, 'champion-mastery-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      this._queueKeeper.cancelByTags([puuid, 'champion-mastery'], 'and')
      this._loadChampionMastery(puuid, { force })
    }
  }

  private _updateMatchHistories(
    puuids: string[],
    params: MatchHistoryQueryParams,
    apiSource: 'sgp' | 'lcu',
    force = false
  ) {
    for (const puuid of Object.keys(this.state.matchHistory)) {
      if (!puuids.includes(puuid)) {
        delete this.state.matchHistory[puuid]
        delete this.state.matchHistoryLoadingState[puuid]

        this._ipc.sendEvent(OngoingGameMain.id, 'match-history-removed', puuid)
      }
    }

    for (const puuid of puuids) {
      this._queueKeeper.cancelByTags([puuid, 'match-history'], 'and')
      this._loadMatchHistory(puuid, { params, force, apiSource })
    }
  }

  private async _loadGameDetails(
    gameIds: number[],
    options: {
      force?: boolean
      apiSource: 'sgp' | 'lcu'
    } = { apiSource: 'lcu' }
  ) {
    const { force, apiSource } = options

    const loadGameDetails = async (gameId: number) => {
      const current = this.state.gameDetails[gameId]

      if (current && !force && current.source === apiSource) {
        this._log.debug('Game timeline query condition not changed, skip', gameId)
        return
      }

      if (apiSource === 'sgp') {
        const cached = this._gameDetailsLruMap.get(`sgp:${gameId}`)

        if (cached) {
          this._log.info('Game details hit cache', 'sgp', gameId)
          runInAction(() => (this.state.gameDetails[gameId] = cached))
          this._ipc.sendEvent(OngoingGameMain.id, 'game-details-loaded', gameId, cached)
          return
        }

        if (this._queueKeeper.hasTask(`sgp-game-details:${gameId}`)) {
          this._log.debug('Game details already in queue', 'sgp', gameId)
          return
        }

        try {
          const { data } = await this._queueKeeper.add(
            'match-history',
            `sgp-game-details:${gameId}`,
            () => this._sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId),
            {
              priority: OngoingGameMain.LOADING_PRIORITY.GAME_DETAILS,
              tags: [gameId.toString(), 'game-details', 'sgp']
            }
          )

          this._log.info('Game details loaded: SGP', gameId)

          const toBeLoaded = { data, source: 'sgp', gameId } satisfies SgpGameDetails

          this._gameDetailsLruMap.set(`sgp:${gameId}`, toBeLoaded)
          runInAction(() => (this.state.gameDetails[gameId] = toBeLoaded))
          this._ipc.sendEvent(OngoingGameMain.id, 'game-details-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            this._log.info('Game details loading aborted', gameId)
            return
          }

          this._log.warn('Error loading game details', error, gameId)
        }
      } else {
        const cached = this._gameDetailsLruMap.get(`lcu:${gameId}`)
        if (cached) {
          this._log.info('Game details hit cache', 'lcu', gameId)
          runInAction(() => (this.state.gameDetails[gameId] = cached))
          this._ipc.sendEvent(OngoingGameMain.id, 'game-details-loaded', gameId, cached)
          return
        }

        if (this._queueKeeper.hasTask(`lcu-game-details:${gameId}`)) {
          this._log.debug('Game details already in queue', 'lcu', gameId)
          return
        }

        try {
          const { data } = await this._queueKeeper.add(
            'misc',
            `lcu-game-details:${gameId}`,
            () => this._lc.api.matchHistory.getTimeline(gameId),
            {
              priority: OngoingGameMain.LOADING_PRIORITY.GAME_DETAILS,
              tags: [gameId.toString(), 'game-details', 'lcu']
            }
          )

          this._log.info('Game details loaded: LCU', gameId)

          const toBeLoaded = { data, source: 'lcu', gameId } satisfies LcuGameTimeline

          this._gameDetailsLruMap.set(`lcu:${gameId}`, toBeLoaded)
          runInAction(() => (this.state.gameDetails[gameId] = toBeLoaded))
          this._ipc.sendEvent(OngoingGameMain.id, 'game-details-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            this._log.info('Game details loading aborted', gameId)
            return
          }

          this._log.warn('Error loading game details', error, gameId)
        }
      }
    }

    await Promise.allSettled(gameIds.map((g) => loadGameDetails(g)))
  }

  private async _loadAdditionalGame(
    gameIds: number[],
    options: {
      force?: boolean
      apiSource: 'sgp' | 'lcu'
    } = { apiSource: 'lcu' }
  ) {
    const { force, apiSource } = options

    const loadGame = async (gameId: number) => {
      const current = this.state.additionalGame[gameId]

      if (current && !force && current.source === apiSource) {
        this._log.debug('Additional game query condition not changed, skip', gameId)
        return
      }

      if (apiSource === 'sgp') {
        const cached = this._gameSummaryLruMap.get(`sgp:${gameId}`)

        if (cached) {
          this._log.info('Game details hit cache', 'sgp', gameId)
          runInAction(() => (this.state.additionalGame[gameId] = cached))
          this._ipc.sendEvent(OngoingGameMain.id, 'additional-game-loaded', gameId, cached)
          return
        }

        if (this._queueKeeper.hasTask(`sgp-additional-game-summary:${gameId}`)) {
          this._log.debug('Additional game already in queue', 'sgp', gameId)
          return
        }

        try {
          this._log.debug('Load additional game: SGP API', gameId)

          const { data } = await this._queueKeeper.add(
            'misc',
            `sgp-additional-game-summary:${gameId}`,
            () => this._sgp.api.matchHistoryQuery.getGameSummaryByGameId(gameId),
            {
              priority: Infinity,
              tags: [gameId.toString(), 'additional-game-summary', 'sgp']
            }
          )

          this._log.info('Additional game loaded: SGP', gameId)

          const toBeLoaded = { data, source: 'sgp', gameId } satisfies SgpGameSummary

          this._gameSummaryLruMap.set(`sgp:${gameId}`, toBeLoaded)
          runInAction(() => (this.state.additionalGame[gameId] = toBeLoaded))
          this._ipc.sendEvent(OngoingGameMain.id, 'additional-game-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            this._log.info('Additional game loading aborted', gameId)
            return
          }

          this._log.warn('Error loading additional game', error, gameId)
        }
      } else {
        const cached = this._gameSummaryLruMap.get(`lcu:${gameId}`)

        if (cached) {
          this._log.info('Additional game hit cache', 'lcu', gameId)
          runInAction(() => (this.state.additionalGame[gameId] = cached))
          this._ipc.sendEvent(OngoingGameMain.id, 'additional-game-loaded', gameId, cached)
          return
        }

        if (this._queueKeeper.hasTask(`lcu-additional-game-summary:${gameId}`)) {
          this._log.debug('Additional game already in queue', 'lcu', gameId)
          return
        }

        try {
          this._log.debug('Load additional game: LCU API', gameId)

          const { data } = await this._queueKeeper.add(
            'misc',
            `lcu-additional-game-summary:${gameId}`,
            () => this._lc.api.matchHistory.getGame(gameId),
            {
              priority: Infinity,
              tags: [gameId.toString(), 'additional-game-summary', 'lcu']
            }
          )

          this._log.info('Additional game loaded: LCU', gameId)

          const toBeLoaded = { data, source: 'lcu', gameId } satisfies LcuGameSummary

          this._gameSummaryLruMap.set(`lcu:${gameId}`, toBeLoaded)
          runInAction(() => (this.state.additionalGame[gameId] = toBeLoaded))
          this._ipc.sendEvent(OngoingGameMain.id, 'additional-game-loaded', gameId, toBeLoaded)
        } catch (error) {
          if (isAbortError(error)) {
            this._log.info('Additional game loading aborted', gameId)
            return
          }

          this._log.warn('Error loading additional game', error, gameId)
        }
      }
    }

    await Promise.allSettled(gameIds.map((g) => loadGame(g)))
  }

  private async _loadMatchHistory(
    puuid: string,
    options: {
      params: MatchHistoryQueryParams
      force?: boolean
      apiSource: 'sgp' | 'lcu'
    } = { params: { startIndex: 0, count: 20 }, apiSource: 'lcu' }
  ) {
    const { params, force, apiSource } = options

    const current = this.state.matchHistory[puuid]

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
        this._log.debug('Player match history query condition not changed, skip (SGP)', puuid)
        return
      }

      if (sameLcuQuery()) {
        this._log.debug('Player match history query condition not changed, skip (LCU)', puuid)
        return
      }
    }

    if (apiSource === 'sgp') {
      try {
        if (this._queueKeeper.hasTask(`sgp-match-history:${puuid}`)) {
          this._log.debug('Player match history already in queue', 'sgp', puuid)
          return
        }

        this.state.setMatchHistoryLoadingState(puuid, 'loading')

        const { data } = await this._queueKeeper.add(
          'match-history',
          `sgp-match-history:${puuid}`,
          () => this._sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(puuid, params),
          {
            priority: OngoingGameMain.LOADING_PRIORITY.MATCH_HISTORY,
            tags: [puuid, 'match-history', 'sgp']
          }
        )

        const filtered = data.games.filter((g) => g.json)

        // this._loadGameDetails(
        //   filtered.map((g) => g.json.gameId).slice(0, this.settings.gameDetailsLoadCount),
        //   { force, apiSource }
        // )

        const toBeLoaded = {
          data: filtered.map(
            (g) => ({ source: 'sgp', data: g, gameId: g.json.gameId }) satisfies SgpGameSummary
          ),
          params,
          source: 'sgp' as const
        }

        runInAction(() => (this.state.matchHistory[puuid] = toBeLoaded))
        this._ipc.sendEvent(OngoingGameMain.id, 'match-history-loaded', puuid, toBeLoaded)
        this.state.setMatchHistoryLoadingState(puuid, 'loaded')

        this._log.info('Load player match history completed: SGP API', puuid)
      } catch (error) {
        if (isAbortError(error)) {
          this._log.info('Player match history loading aborted', puuid)
          return
        }

        this._log.warn('Error loading player match history', error, puuid)
        this.state.setMatchHistoryLoadingState(puuid, 'error')
      }
    } else {
      try {
        if (this._queueKeeper.hasTask(`lcu-match-history:${puuid}`)) {
          this._log.debug('Player match history already in queue', 'lcu', puuid)
          return
        }

        this.state.setMatchHistoryLoadingState(puuid, 'loading')

        const { data } = await this._queueKeeper.add(
          'match-history',
          `lcu-match-history:${puuid}`,
          () =>
            this._lc.api.matchHistory.getMatchHistory(
              puuid,
              params.startIndex ?? 0,
              (params.count ?? 20) - 1
            ),
          {
            priority: OngoingGameMain.LOADING_PRIORITY.MATCH_HISTORY,
            tags: [puuid, 'match-history', 'lcu']
          }
        )

        const detailedGameMap: Record<number, LcuGameSummary> = {}
        const loadGame = async (gameId: number) => {
          const cached = this._gameSummaryLruMap.get(`lcu:${gameId}`) as LcuGameSummary | undefined

          if (cached) {
            detailedGameMap[gameId] = cached
            return
          }

          if (this._queueKeeper.hasTask(`lcu-game-summary:${gameId}`)) {
            this._log.debug('Game summary already in queue', 'lcu', gameId)
            return
          }

          try {
            const { data } = await this._queueKeeper.add(
              'misc',
              `lcu-game-summary:${gameId}`,
              () => this._lc.api.matchHistory.getGame(gameId),
              {
                priority: Infinity, // 完整 game summary 实际上走的是 LC 的缓存。因此可以优先加载容易成功的请求
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
              this._log.info('Game summary loading aborted', puuid, gameId)
              return
            }

            this._log.warn('Error loading game summary', error, puuid, gameId)
          }
        }

        // this._loadGameDetails(
        //   data.games.games.map((g) => g.gameId).slice(0, this.settings.gameDetailsLoadCount),
        //   { force, apiSource }
        // )

        await Promise.allSettled(data.games.games.map((g) => loadGame(g.gameId)))

        const games = data.games.games.map(
          (g) => detailedGameMap[g.gameId] || { gameId: g.gameId, source: 'lcu', data: g }
        )

        const toBeLoaded = {
          data: games,
          params,
          source: 'lcu' as 'sgp' | 'lcu'
        }

        runInAction(() => (this.state.matchHistory[puuid] = toBeLoaded))
        this._ipc.sendEvent(OngoingGameMain.id, 'match-history-loaded', puuid, toBeLoaded)
        this.state.setMatchHistoryLoadingState(puuid, 'loaded')

        this._log.info('Load player match history completed: LCU API', puuid)
      } catch (error) {
        if (isAbortError(error)) {
          this._log.info('Player match history loading aborted', puuid)
          return
        }

        this._log.warn('Error loading player match history', error, puuid)
        this.state.setMatchHistoryLoadingState(puuid, 'error')
      }
    }
  }

  private async _loadSummoner(
    puuid: string,
    options: { force?: boolean; isAdditional?: boolean } = {}
  ) {
    const { force, isAdditional } = options

    // 如果不是强制更新, 并且已经有数据, 那么就不再加载
    if (!force && this.state.summoner[puuid]) {
      this._log.info('Summoner info already exists', puuid)
      return
    }

    if (this._queueKeeper.hasTask(`summoner:${puuid}`)) {
      this._log.debug('Summoner already in queue', puuid)
      return
    }

    const tags = [puuid, 'summoner']

    if (isAdditional) {
      tags.push('additional-summoner')
    }

    try {
      const { data } = await this._queueKeeper.add(
        'misc',
        `summoner:${puuid}`,
        () => this._lc.api.summoner.getSummonerByPuuid(puuid),
        {
          priority: OngoingGameMain.LOADING_PRIORITY.SUMMONER,
          tags
        }
      )

      runInAction(() => (this.state.summoner[puuid] = data))
      this._ipc.sendEvent(OngoingGameMain.id, 'summoner-loaded', puuid, data)

      this._log.info('Load summoner info completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        this._log.info('Summoner info loading aborted', puuid)
        return
      }

      this._log.warn('Error loading summoner info', error, puuid)
    }
  }

  private async _loadSavedInfo(puuid: string, options: { force?: boolean } = {}) {
    // just used to suppress ts error
    if (!this._lc.state.auth || !this._lc.data.summoner.me) {
      return
    }

    const query = {
      puuid,
      selfPuuid: this._lc.data.summoner.me.puuid,
      region: this._lc.state.auth.region,
      rsoPlatformId: this._lc.state.auth.rsoPlatformId
    }

    const { force } = options

    if (!force && this.state.savedInfo[puuid]) {
      return
    }

    if (this._queueKeeper.hasTask(`saved-info:${puuid}`)) {
      this._log.debug('Saved info already in queue', puuid)
      return
    }

    try {
      const data = await this._queueKeeper.add(
        'misc',
        `saved-info:${puuid}`,
        () => this._saved.querySavedPlayerWithGames(query),
        {
          priority: OngoingGameMain.LOADING_PRIORITY.SAVED_INFO,
          tags: [puuid, 'saved-info']
        }
      )

      if (!data) {
        return
      }

      this._loadAdditionalGame(
        data.encounteredGames.data.map((c) => c.gameId),
        {
          force,
          apiSource: this.state.apiShouldUse
        }
      )

      data.tags.forEach((t) => {
        this._loadSummoner(t.selfPuuid, { force })
      })

      runInAction(() => (this.state.savedInfo[puuid] = data))
      this._ipc.sendEvent(OngoingGameMain.id, 'saved-info-loaded', puuid, data)

      this._log.info('Load saved info completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        this._log.info('Saved info loading aborted', puuid)
        return
      }

      this._log.warn('Error loading saved info', error, puuid)
    }
  }

  private async _loadRankedStats(puuid: string, options: { force?: boolean } = {}) {
    const { force } = options

    if (!force && this.state.rankedStats[puuid]) {
      this._log.debug('Ranked stats already exists', puuid)
      return
    }

    if (this._queueKeeper.hasTask(`ranked-stats:${puuid}`)) {
      this._log.debug('Ranked stats already in queue', puuid)
      return
    }

    try {
      const { data } = await this._queueKeeper.add(
        'misc',
        `ranked-stats:${puuid}`,
        () => this._lc.api.ranked.getRankedStats(puuid),
        {
          priority: OngoingGameMain.LOADING_PRIORITY.RANKED_STATS,
          tags: [puuid, 'ranked-stats']
        }
      )

      runInAction(() => (this.state.rankedStats[puuid] = data))
      this._ipc.sendEvent(OngoingGameMain.id, 'ranked-stats-loaded', puuid, data)

      this._log.info('Load ranked stats completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        this._log.info('Ranked stats loading aborted', puuid)
        return
      }

      this._log.warn('Error loading ranked stats', error, puuid)
    }
  }

  private async _loadChampionMastery(puuid: string, options: { force?: boolean } = {}) {
    const { force } = options

    if (!force && this.state.championMastery[puuid]) {
      this._log.debug('Champion mastery already exists', puuid)
      return
    }

    if (this._queueKeeper.hasTask(`champion-mastery:${puuid}`)) {
      this._log.debug('Champion mastery already in queue', puuid)
      return
    }

    try {
      const { data } = await this._queueKeeper.add(
        'misc',
        `champion-mastery:${puuid}`,
        () => this._lc.api.championMastery.getPlayerChampionMastery(puuid),
        {
          priority: OngoingGameMain.LOADING_PRIORITY.CHAMPION_MASTERY,
          tags: [puuid, 'champion-mastery']
        }
      )

      const simplifiedMastery = data
        .map((m) => ({
          championId: m.championId,
          championLevel: m.championLevel,
          championPoints: m.championPoints,
          milestoneGrades: m.milestoneGrades
        }))
        .reduce(
          (obj, cur) => {
            obj[cur.championId] = cur
            return obj
          },
          {} as Record<
            number,
            { championId: number; championLevel: number; championPoints: number }
          >
        )

      runInAction(() => (this.state.championMastery[puuid] = simplifiedMastery))
      this._ipc.sendEvent(OngoingGameMain.id, 'champion-mastery-loaded', puuid, simplifiedMastery)

      this._log.info('Load champion mastery completed', puuid)
    } catch (error) {
      if (isAbortError(error)) {
        this._log.info('Champion mastery loading aborted', puuid)
        return
      }

      this._log.warn('Error loading champion mastery', error, puuid)
    }
  }

  private _clearAndReloadAll() {
    this.state.clear({ keepTagParams: true, keepAdditionalInfo: true })
    this._ipc.sendEvent(OngoingGameMain.id, 'clear')

    const puuids = Object.values(this.state.teams).flat()

    this._updateSummoners(puuids, true)
    this._updateRankedStats(puuids, true)
    this._updateSavedInfo(puuids, true)
    this._updateChampionMasteries(puuids, true)
    this._updateMatchHistories(
      puuids,
      {
        startIndex: 0,
        count: this.settings.matchHistoryLoadCount,
        ...this.state.matchHistoryTagParams
      },
      this.state.apiShouldUse,
      true
    )
    this._updateAdditionalInfo()
  }

  private _reloadPlayer(puuid: string) {
    this._queueKeeper.cancelByTags(puuid)

    this._loadMatchHistory(puuid, {
      params: {
        startIndex: 0,
        count: this.settings.matchHistoryLoadCount,
        ...this.state.matchHistoryTagParams
      },
      force: true,
      apiSource: this.state.apiShouldUse
    })
    this._loadSummoner(puuid, { force: true })
    this._loadRankedStats(puuid, { force: true })
    this._loadSavedInfo(puuid, { force: true })
    this._loadChampionMastery(puuid, { force: true })
  }

  private _handleIpcCall() {
    this._ipc.onCall(OngoingGameMain.id, 'getAll', () => {
      const matchHistory = toJS(this.state.matchHistory)
      const summoner = toJS(this.state.summoner)
      const rankedStats = toJS(this.state.rankedStats)
      const savedInfo = toJS(this.state.savedInfo)
      const championMastery = toJS(this.state.championMastery)
      const gameDetails = toJS(this.state.gameDetails)
      const additionalGames = toJS(this.state.additionalGame)

      return {
        matchHistory,
        summoner,
        rankedStats,
        savedInfo,
        championMastery,
        gameDetails,
        additionalGames
      }
    })

    this._ipc.onCall(
      OngoingGameMain.id,
      'setMatchHistoryTagParams',
      (_, params: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'>) => {
        this.state.setMatchHistoryTagParams(params)
      }
    )

    this._ipc.onCall(OngoingGameMain.id, 'reload', () => {
      this._clearAndReloadAll()
    })

    this._ipc.onCall(OngoingGameMain.id, 'reloadPlayer', (_, puuid: string) => {
      this._reloadPlayer(puuid)
    })
  }

  private _calcAnalysis() {
    if (!this.state.teams) {
      return null
    }

    try {
      const playerAnalyses: Record<string, MatchHistoryGamesAnalysisAll> = {}

      for (const [puuid, matchHistory] of Object.entries(this.state.matchHistory)) {
        if (!matchHistory) {
          continue
        }

        const analysis = analyzeMatchHistory(matchHistory.data, puuid)

        if (analysis) {
          playerAnalyses[puuid] = analysis
        }
      }

      const teamAnalyses: Record<string, MatchHistoryGamesAnalysisTeamSide> = {}

      for (const [sideId, puuids] of Object.entries(this.state.teams)) {
        const teamPlayerAnalyses = puuids.map((p) => playerAnalyses[p]).filter(Boolean)
        const teamAnalysis = analyzeTeamMatchHistory(teamPlayerAnalyses)
        if (teamAnalysis) {
          teamAnalyses[sideId] = teamAnalysis
        }
      }
      return {
        players: playerAnalyses,
        teams: teamAnalyses
      }
    } catch (error) {
      this._log.warn('Error calculating match history', error)
      return null
    }
  }

  private _calcPremade() {
    if (!Object.keys(this.state.matchHistory).length) {
      return []
    }

    const matchesByTeams = Object.values(this.state.matchHistory)
      .map((m) => {
        return m.data.map((d) => {
          // 按照队伍分组
          // CHERRY 下也按照集体分组，而非子队。这是考虑到斗魂组队可以跨越子队
          const groupedByTeamId = toIdentities(d).reduce(
            (acc, i) => {
              if (!acc[i.teamId]) {
                acc[i.teamId] = []
              }
              acc[i.teamId].push(i.puuid)
              return acc
            },
            {} as Record<number, string[]>
          )

          return Object.values(groupedByTeamId)
            .filter((c) => c.length > 1)
            .map((g) => ({
              players: g,
              id: d.gameId.toString()
            }))
        })
      })
      .flat(2)

    // matchesByTeams 可能包含多个相同的对局，去重
    const deduplicatedMap = new Map<string, { players: string[]; id: string }>(
      matchesByTeams.map((m) => [m.id, m])
    )

    // 用到了将近两年前的工具，我选择不去动它，只做转换
    // 此方法追溯到 v1.1.x
    const calculated = calculateTogetherTimes(
      Array.from(deduplicatedMap.values()),
      Object.values(this.state.teams).flat(),
      this.settings.premadeTeamInferMatchCountThreshold
    )

    const simplified = removeSubsets(calculated, (t) => t.players)
    const mergedOverlappingSets = mergeOverlappingSets(simplified.map((t) => t.players))

    return mergedOverlappingSets as string[][]
  }

  private readonly SMITE_SPELL_ID = 11

  /**
   * 识别当前对局中的打野玩家
   * 优先用 positionAssignments，回退到召唤师技能（惩戒）判断
   */
  private _getJunglerPuuids(): string[] {
    const junglers: string[] = []
    const positions = this.state.positionAssignments

    // 1. 先从 positionAssignments 中找
    for (const [puuid, pos] of Object.entries(positions)) {
      if (pos.position && pos.position.toUpperCase() === 'JUNGLE') {
        junglers.push(puuid)
      }
    }

    if (junglers.length > 0) return junglers

    // 2. 回退: 从当前对局的召唤师技能中找惩戒使用者
    // 优先从 additional.spells (GSM/spectator 数据)
    for (const [puuid, spells] of Object.entries(this.state.additional.spells)) {
      if (spells.spell1Id === this.SMITE_SPELL_ID || spells.spell2Id === this.SMITE_SPELL_ID) {
        junglers.push(puuid)
      }
    }

    if (junglers.length > 0) return junglers

    // 3. 再回退: 从 gameflow session 的 playerChampionSelections 中找
    const session = this._lc.data.gameflow.session
    if (session) {
      for (const p of session.gameData.playerChampionSelections) {
        if (
          p.puuid &&
          (p.spell1Id === this.SMITE_SPELL_ID || p.spell2Id === this.SMITE_SPELL_ID)
        ) {
          junglers.push(p.puuid)
        }
      }
    }

    // 4. 最后回退: 从 champSelect session 中找
    if (junglers.length === 0) {
      const cs = this._lc.data.champSelect.session
      if (cs) {
        for (const p of [...cs.myTeam, ...cs.theirTeam]) {
          if (
            p.puuid &&
            p.puuid !== EMPTY_PUUID &&
            (p.spell1Id === this.SMITE_SPELL_ID || p.spell2Id === this.SMITE_SPELL_ID)
          ) {
            junglers.push(p.puuid)
          }
        }
      }
    }

    return junglers
  }

  /**
   * 为打野玩家加载 game details（时间线数据）
   */
  private _loadJungleGameDetails(puuid: string) {
    const mh = this.state.matchHistory[puuid]
    if (!mh) {
      this._log.info(`Jungle details: no match history for ${puuid}`)
      return
    }

    this._log.info(`Jungle details: ${mh.data.length} games in history for ${puuid}, source=${mh.source}`)

    const jungleGameIds = filterJungleGames(mh.data, puuid)
    this._log.info(`Jungle details: found ${jungleGameIds.length} jungle games for ${puuid}`)

    const JUNGLE_DETAILS_MAX = 50
    const toLoad = jungleGameIds.slice(0, JUNGLE_DETAILS_MAX)

    if (toLoad.length === 0) return

    this._log.info(`Loading ${toLoad.length} jungle game details for ${puuid}`)
    this._loadGameDetails(toLoad, { apiSource: this.state.apiShouldUse })
  }

  /**
   * 计算所有打野玩家的路径偏好分析
   */
  private _calcJungleAnalysis(): Record<string, JunglePathingAnalysis> {
    const result: Record<string, JunglePathingAnalysis> = {}
    const junglerPuuids = this._getJunglerPuuids()

    for (const puuid of junglerPuuids) {
      const mh = this.state.matchHistory[puuid]
      if (!mh) continue

      const jungleGameIds = new Set(filterJungleGames(mh.data, puuid))
      const relevantDetails = Object.values(this.state.gameDetails).filter((d) =>
        jungleGameIds.has(d.gameId)
      )
      const relevantSummaries = mh.data.filter((s) => jungleGameIds.has(s.gameId))

      if (relevantDetails.length === 0) continue

      const currentChampionId = this.state.championSelections[puuid] ?? 0
      const analysis = analyzeJunglePathing(relevantDetails, relevantSummaries, puuid, currentChampionId)
      if (analysis) {
        result[puuid] = analysis
      }
    }

    return result
  }

  private _handleCalculation() {
    // 重新计算战绩信息
    this._mobx.reaction(
      () => ({
        matches: Object.values(this.state.matchHistory),
        teams: Object.values(this.state.teams).flat()
      }),
      (_) => {
        this.state.setPlayerStats(this._calcAnalysis())
        this.state.setInferredPremadeTeams(this._calcPremade())
      },
      { delay: 200, equals: comparer.shallow }
    )

    // 计算基于推测的组队信息
    this._mobx.reaction(
      () => ({
        matchHistory: Object.values(this.state.matchHistory),
        threshold: this.settings.premadeTeamInferMatchCountThreshold
      }),
      (_changedV) => {
        this.state.setInferredPremadeTeams(this._calcPremade())
      },
      { delay: 200, equals: comparer.shallow }
    )

    // 当 matchHistory 就绪时，为打野玩家加载 game details
    this._mobx.reaction(
      () => ({
        matchHistoryKeys: Object.keys(this.state.matchHistory),
        junglerPuuids: this._getJunglerPuuids()
      }),
      ({ junglerPuuids, matchHistoryKeys }) => {
        if (matchHistoryKeys.length === 0) return

        this._log.info(
          `Jungle details reaction: ${matchHistoryKeys.length} players, ` +
            `${junglerPuuids.length} junglers: [${junglerPuuids.map((p) => p.substring(0, 8)).join(', ')}]`
        )

        for (const puuid of junglerPuuids) {
          this._loadJungleGameDetails(puuid)
        }
      },
      { delay: 500, equals: comparer.structural }
    )

    // 当 gameDetails 变化时，重新计算打野分析
    this._mobx.reaction(
      () => ({
        detailKeys: Object.keys(this.state.gameDetails),
        junglerPuuids: this._getJunglerPuuids(),
        matchHistoryKeys: Object.keys(this.state.matchHistory)
      }),
      ({ detailKeys, junglerPuuids }) => {
        if (junglerPuuids.length === 0) return

        this._log.info(`Jungle analysis reaction: ${detailKeys.length} details loaded`)
        const analysis = this._calcJungleAnalysis()
        const count = Object.keys(analysis).length
        this._log.info(`Jungle analysis computed for ${count} players`)
        this.state.setJungleAnalysis(analysis)
      },
      { delay: 300, equals: comparer.structural }
    )
  }

  private async _handleEndOfGameSave() {
    const isInEndOfGame = computed(() => {
      return (
        this._lc.data.gameflow.phase === 'EndOfGame' ||
        this._lc.data.gameflow.phase === 'PreEndOfGame'
      )
    })

    this._mobx.reaction(
      () => isInEndOfGame.get(),
      async (yes) => {
        if (yes) {
          if (
            !this._lc.state.auth ||
            !this._lc.data.summoner.me ||
            !this.state.queryStage.gameInfo
          ) {
            return
          }

          // 在未来的某个时间，可能出现无法获取 gameId 的情况
          if (this.state.queryStage.phase !== 'in-game' || !this.state.queryStage.gameInfo.gameId) {
            return
          }

          const players = Object.values(this.state.teams || {}).flat()

          if (!players.includes(this._lc.data.summoner.me.puuid)) {
            this._log.info('Current player not in this game, skip recording')
            return
          }

          const filteredPlayers = players.filter((p) => p !== this._lc.data.summoner.me?.puuid)

          for (const player of filteredPlayers) {
            await this._saved.saveEncounteredGame({
              gameId: this.state.queryStage.gameInfo.gameId,
              puuid: player,
              region: this._lc.state.auth.region,
              rsoPlatformId: this._lc.state.auth.rsoPlatformId,
              selfPuuid: this._lc.data.summoner.me.puuid,
              queueType: this.state.queryStage.gameInfo.queueType
            })

            this._log.info(`Save game info: ${this.state.queryStage.gameInfo.gameId}`)
            await this._saved.saveSavedPlayer({
              encountered: true,
              puuid: player,
              selfPuuid: this._lc.data.summoner.me.puuid,
              region: this._lc.state.auth.region,
              rsoPlatformId: this._lc.state.auth.rsoPlatformId
            })
            this._log.info(`Save player info: ${player}`)
          }
        }
      }
    )
  }

  /**
   * 或许有人需要这个
   */
  private _handleRemindTaggedPlayers() {
    let reminded: string[] = []

    const itsTimeToSend = computed(() => {
      if (!this._lc.data.chat.conversations.championSelect) {
        return null
      }

      return this._lc.data.chat.conversations.championSelect.id
    })

    const playersToSend = computed(
      () => {
        return Object.entries(this.state.savedInfo)
          .map(([puuid, info]) => {
            if (!info.tag) {
              return null
            }

            const summoner = this.state.summoner[puuid]
            if (!summoner) {
              return null
            }

            return {
              puuid,
              name: `${summoner.gameName}#${summoner.tagLine}`,
              tag: info.tag
            }
          })
          .filter((p) => p !== null)
      },
      {
        equals: (a, b) => {
          const aPuuids = a.map((p) => p.puuid)
          const bPuuids = b.map((p) => p.puuid)
          return comparer.shallow(aPuuids, bPuuids)
        }
      }
    )

    this._mobx.reaction(
      () => itsTimeToSend.get(),
      (id) => {
        if (!id) {
          reminded = []
          return
        }
      }
    )

    this._mobx.reaction(
      () => [playersToSend.get(), itsTimeToSend.get()] as const,
      ([players, roomId]) => {
        if (!roomId) {
          return
        }

        for (const player of players) {
          if (reminded.includes(player.puuid)) {
            continue
          }

          this._lc.api.chat
            .chatSend(
              roomId,
              `[${i18next.t('ongoing-game-main.taggedPlayer')}: ${player.name}]: \n${player.tag}`,
              'celebration'
            )
            .catch(() => {})
          reminded.push(player.puuid)
        }
      }
    )
  }

  /**
   * 聊胜于无的信息补全功能
   */
  private _handleInformationCompletion() {
    this._mobx.reaction(
      () => this.state.queryStage,
      (_stage) => {
        this._updateAdditionalInfo()
      },
      { delay: 500, fireImmediately: true }
    )
  }

  private _updateAdditionalInfo() {
    if (
      !this.state.queryStage.gameInfo ||
      this.state.queryStage.phase !== 'in-game' ||
      !this._lc.data.summoner.me?.puuid
    ) {
      return
    }

    this._queueKeeper.cancelByTags(['gsm-gameflow', 'spectator-gameflow'], 'or')

    const getGsmGameMembers = async (puuid: string) => {
      try {
        if (this._queueKeeper.hasTask('gsm-gameflow')) {
          this._log.debug('Game members already in queue', puuid)
          return null
        }

        const {
          data: {
            game: { teamOne, teamTwo, gameMode, playerChampionSelections }
          }
        } = await this._queueKeeper.add(
          'misc',
          `gsm-gameflow:${puuid}`,
          () => this._sgp.api.gsm.getByPuuid(puuid),
          {
            priority: OngoingGameMain.LOADING_PRIORITY.ADDITIONAL_INFO,
            tags: [puuid, 'gsm-gameflow']
          }
        )

        this._log.info('additional team info by gsm game')

        return { teamOne, teamTwo, gameMode, spells: playerChampionSelections }
      } catch (error) {
        if (isAbortError(error)) {
          this._log.info('Abort error getting game members', error)
          return null
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          return null
        }

        this._log.warn('Error getting game members', error)
        return null
      }
    }

    const getSpectator = async (puuid: string) => {
      try {
        if (this._queueKeeper.hasTask('spectator-gameflow')) {
          this._log.debug('Spectator already in queue', puuid)
          return null
        }

        const {
          data: {
            game: { teamOne, teamTwo, gameMode, playerChampionSelections }
          }
        } = await this._queueKeeper.add(
          'misc',
          `spectator-gameflow:${puuid}`,
          () => this._sgp.api.gsm.getSpectatorByPuuid(puuid),
          {
            priority: OngoingGameMain.LOADING_PRIORITY.ADDITIONAL_INFO,
            tags: [puuid, 'spectator-gameflow']
          }
        )

        this._log.info('additional team info by spectator data')

        return { teamOne, teamTwo, gameMode, spells: playerChampionSelections }
      } catch (error) {
        if (isAbortError(error)) {
          this._log.info('Abort error getting spectator', error)
          return null
        }

        // 忽略 404 和 409 (disabled spectator APIs)
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 || error.response?.status === 409)
        ) {
          return null
        }

        this._log.warn('Error getting spectator', error)
        return null
      }
    }

    const extractTeamMembers = (
      gameMode: string,
      teamOne: TeamPropsToBeExtracted[],
      teamTwo: TeamPropsToBeExtracted[],
      spells: { puuid: string; spell1Id: number; spell2Id: number }[]
    ): AdditionalResult => {
      const all = [...teamOne, ...teamTwo].filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)

      if (gameMode === 'CHERRY') {
        return {
          teams: {
            'TEAM-ALL': all.map((p) => p.puuid)
          },
          selections: all.reduce(
            (acc, p) => {
              acc[p.puuid] = p.championId
              return acc
            },
            {} as Record<string, number>
          ),
          teamParticipantGroups: all.reduce(
            (acc, p) => {
              acc[p.puuid] = p.teamParticipantId
              return acc
            },
            {} as Record<string, number>
          ),
          spells: spells.reduce(
            (acc, p) => {
              acc[p.puuid] = { spell1Id: p.spell1Id, spell2Id: p.spell2Id }
              return acc
            },
            {} as Record<string, { spell1Id: number; spell2Id: number }>
          ),
          positions: all.reduce(
            (acc, p) => {
              acc[p.puuid] = {
                position: p.selectedPosition,
                role: parseSelectedRole(p.selectedRole)
              }
              return acc
            },
            {} as Record<string, { position: string; role: ParsedRole | null }>
          )
        }
      }

      return {
        teams: {
          'TEAM-100': teamOne.map((p) => p.puuid).filter((p) => p && p !== EMPTY_PUUID),
          'TEAM-200': teamTwo.map((p) => p.puuid).filter((p) => p && p !== EMPTY_PUUID)
        },
        selections: all.reduce(
          (acc, p) => {
            acc[p.puuid] = p.championId
            return acc
          },
          {} as Record<string, number>
        ),
        teamParticipantGroups: all.reduce(
          (acc, p) => {
            if (!p.teamParticipantId) {
              return acc
            }

            acc[p.puuid] = p.teamParticipantId
            return acc
          },
          {} as Record<string, number>
        ),
        spells: spells.reduce(
          (acc, p) => {
            acc[p.puuid] = { spell1Id: p.spell1Id, spell2Id: p.spell2Id }
            return acc
          },
          {} as Record<string, { spell1Id: number; spell2Id: number }>
        ),
        positions: all.reduce(
          (acc, p) => {
            acc[p.puuid] = { position: p.selectedPosition, role: parseSelectedRole(p.selectedRole) }
            return acc
          },
          {} as Record<string, { position: string; role: ParsedRole | null }>
        )
      } as AdditionalResult
    }

    const puuid = this._lc.data.summoner.me.puuid

    const enableGsm = this._rc.state.ongoingGameConfig.spotlight.gsmByPuuid
    const enableSpectator = this._rc.state.ongoingGameConfig.spotlight.spectatorByPuuid

    type TeamPropsToBeExtracted = {
      puuid: string
      championId: number
      teamParticipantId: number
      selectedPosition: string
      selectedRole: string
    }

    type ReturnResult = {
      teamOne: TeamPropsToBeExtracted[]
      teamTwo: TeamPropsToBeExtracted[]
      spells: { puuid: string; spell1Id: number; spell2Id: number }[]
      gameMode: string
    }

    const tasks: (() => Promise<ReturnResult | null>)[] = []

    if (enableGsm) {
      tasks.push(() => getGsmGameMembers(puuid))
    }

    if (enableSpectator) {
      tasks.push(() => getSpectator(puuid))
    }

    Promise.allSettled(tasks.map((t) => t())).then((results) => {
      if (this.state.queryStage.phase !== 'in-game') {
        return
      }

      const mergedTeams = {} as Record<string, string[]>
      const mergedSelections = {} as Record<string, number>
      const mergedTeamParticipantGroups = {} as Record<string, number>
      const mergedSpells = {} as Record<
        string,
        {
          spell1Id: number
          spell2Id: number
        }
      >
      const mergedPositions = {} as Record<string, { position: string; role: ParsedRole | null }>

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { teamOne, teamTwo, gameMode, spells } = result.value
          const { teams, selections, teamParticipantGroups, positions } = extractTeamMembers(
            gameMode,
            teamOne,
            teamTwo,
            spells
          )

          for (const [tI, m] of Object.entries(teams)) {
            if (mergedTeams[tI]) {
              mergedTeams[tI] = memberMerge(mergedTeams[tI], m)
            } else {
              mergedTeams[tI] = m
            }
          }

          Object.assign(mergedSelections, selections)
          Object.assign(mergedTeamParticipantGroups, teamParticipantGroups)
          Object.assign(mergedSpells, spells)
          Object.assign(mergedPositions, positions)
        }
      }

      this.state.setAdditional({
        teams: mergedTeams,
        selections: mergedSelections,
        teamParticipantGroups: mergedTeamParticipantGroups,
        spells: mergedSpells,
        positions: mergedPositions
      })
    })
  }
}
