import { EMPTY_PUUID } from '@shared/constants/common'
import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { MatchHistoryGamesAnalysisTeamSide } from '@shared/data-adapter/analysis/teams'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { ChampSelectTeam } from '@shared/types/league-client/champ-select'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { ParsedRole, parseSelectedRole } from '@shared/utils/ranked'
import { computed, makeAutoObservable, observable } from 'mobx'

import { AppCommonMain } from '../app-common'
import { LeagueClientData } from '../league-client/lc-state'
import { SgpMain } from '../sgp'
import { SavedPlayer } from '../storage/entities/SavedPlayers'
import { memberMerge } from './member-merge'

export class OngoingGameSettings {
  enabled: boolean = true
  matchHistoryLoadCount: number = 50

  /**
   * 会拉取战绩中前 n 局的时间线数量
   */
  gameDetailsLoadCount: number = 8
  concurrency: number = 4

  /**
   * 战绩查询时, 优先查询当前模式还是全部模式, 仅当 SGP API 启用时有效
   */
  matchHistoryTagPreference: 'current' | 'all' = 'current'

  orderPlayerBy = 'default' as
    | 'win-rate'
    | 'kda'
    | 'default'
    | 'akari-score'
    | 'position'
    | 'premade-team'

  showChampionUsage = 'recent' as 'recent' | 'mastery' | 'none'
  showMatchHistoryItemBorder = false
  autoRouteWhenGameStarts = false
  playerCardTags = {
    showPremadeTeamTag: true,
    showSuspiciousFlashPositionTag: true,
    showWinningStreakTag: true,
    showLosingStreakTag: true,
    showSoloKillsTag: true,
    showSoloDeathsTag: true,
    showGreatPerformanceTag: true,
    showAverageTeamDamageTag: false,
    showAverageTeamDamageTakenTag: false,
    showAverageTeamGoldTag: false,
    showAverageDamageGoldEfficiencyTag: false,
    showAverageEnemyMissingPingsTag: false,
    showAverageVisionScoreTag: false,
    showSelfTag: true,
    showMetTag: true,
    showTaggedTag: true,
    showWinRateTeamTag: true,
    showPrivacyTag: true,
    showAkariScoreTag: false
  }

  setOrderPlayerBy(
    value: 'win-rate' | 'kda' | 'default' | 'akari-score' | 'position' | 'premade-team'
  ) {
    this.orderPlayerBy = value
  }

  setMatchHistoryTagPreference(value: 'current' | 'all') {
    this.matchHistoryTagPreference = value
  }

  setShowChampionUsage(value: 'recent' | 'mastery' | 'none') {
    this.showChampionUsage = value
  }

  setShowMatchHistoryItemBorder(value: boolean) {
    this.showMatchHistoryItemBorder = value
  }

  setAutoRouteWhenGameStarts(value: boolean) {
    this.autoRouteWhenGameStarts = value
  }

  setPlayerCardTags(value: typeof this.playerCardTags) {
    this.playerCardTags = value
  }

  setEnabled(value: boolean) {
    this.enabled = value
  }

  setMatchHistoryLoadCount(value: number) {
    this.matchHistoryLoadCount = value
  }

  setConcurrency(limit: number) {
    this.concurrency = limit
  }

  setGameDetailsLoadCount(value: number) {
    this.gameDetailsLoadCount = value
  }

  constructor() {
    makeAutoObservable(this, {
      playerCardTags: observable.ref
    })
  }
}

export class OngoingGameState {
  /**
   * 当前进行的英雄选择
   */
  get championSelections() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      const selections: Record<string, number> = {}
      this._lcData.champSelect.session.myTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      this._lcData.champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      return selections
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      const selections: Record<string, number> = {}
      this._lcData.gameflow.session.gameData.playerChampionSelections.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId
        }
      })

      this._lcData.gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      this._lcData.gameflow.session.gameData.teamTwo.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      return selections
    }

    return {}
  }

  get positionAssignments() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      const assignments: Record<
        string,
        {
          position: string
          role: ParsedRole | null
        }
      > = {}

      this._lcData.champSelect.session.myTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.assignedPosition.toUpperCase(),
            role: null
          }
        }
      })

      this._lcData.champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.assignedPosition.toUpperCase(),
            role: null
          }
        }
      })

      return assignments
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      const assignments: Record<
        string,
        {
          position: string
          role: ParsedRole | null
        }
      > = {}

      this._lcData.gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.selectedPosition,
            role: parseSelectedRole(p.selectedRole)
          }
        }
      })

      this._lcData.gameflow.session.gameData.teamTwo.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.selectedPosition,
            role: parseSelectedRole(p.selectedRole)
          }
        }
      })

      return assignments
    }

    return {}
  }

  /**
   * 当前对局的队伍分配
   */
  get teams() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      if (this.queryStage.gameInfo.queueType === 'CHERRY') {
        return {
          'TEAM-ALL': [
            ...this._lcData.champSelect.session.myTeam,
            ...this._lcData.champSelect.session.theirTeam
          ]
            .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
            .map((p) => p.puuid)
        }
      }

      const teams: Record<string, string[]> = {}

      const processMember = (p: ChampSelectTeam) => {
        if (!p.puuid || p.puuid === EMPTY_PUUID) {
          return
        }

        const teamIdentifier = p.team === 100 || p.team === 1 ? 'TEAM-100' : 'TEAM-200'

        if (!teams[teamIdentifier]) {
          teams[teamIdentifier] = []
        }
        teams[teamIdentifier].push(p.puuid)
      }

      this._lcData.champSelect.session.myTeam.forEach(processMember)
      this._lcData.champSelect.session.theirTeam.forEach(processMember)

      return teams
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      if (this.queryStage.gameInfo.queueType === 'CHERRY') {
        // sometimes teamOne and teamTwo will have fake players, need to filter out
        const realPlayers = this._lcData.gameflow.session.gameData.playerChampionSelections.map(
          (c) => c.puuid
        )

        return {
          'TEAM-ALL': [
            ...this._lcData.gameflow.session.gameData.teamOne,
            ...this._lcData.gameflow.session.gameData.teamTwo
          ]
            .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
            .filter((p) => realPlayers.includes(p.puuid))
            .map((p) => p.puuid)
        }
      }

      const teams: Record<string, string[]> = {
        'TEAM-100': [],
        'TEAM-200': []
      }

      this._lcData.gameflow.session.gameData.teamOne
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['TEAM-100'].push(p.puuid)
        })

      this._lcData.gameflow.session.gameData.teamTwo
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['TEAM-200'].push(p.puuid)
        })

      // experimental 特性
      for (const [tI, m] of Object.entries(this.additionalMembers)) {
        if (teams[tI]) {
          teams[tI] = memberMerge(teams[tI], m)
        } else {
          teams[tI] = m
        }
      }

      return teams
    }

    return {}
  }

  /**
   * 当前游戏的进行状态简化，用于区分 League Akari 的几个主要阶段
   *
   * unavailable - 不需要介入的状态
   *
   * champ-select - 正在英雄选择阶段
   *
   * in-game - 在游戏中或游戏结算中
   */
  get queryStage() {
    if (
      this._lcData.gameflow.session &&
      this._lcData.gameflow.session.phase === 'ChampSelect' &&
      this._lcData.champSelect.session
    ) {
      return {
        phase: 'champ-select' as 'champ-select' | 'in-game',
        gameInfo: {
          queueId: this._lcData.gameflow.session.gameData.queue.id,
          queueType: this._lcData.gameflow.session.gameData.queue.type,
          gameId: this._lcData.gameflow.session.gameData.gameId,
          gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
        }
      }
    }

    if (
      this._lcData.gameflow.session &&
      (this._lcData.gameflow.session.phase === 'GameStart' ||
        this._lcData.gameflow.session.phase === 'InProgress' ||
        this._lcData.gameflow.session.phase === 'WaitingForStats' ||
        this._lcData.gameflow.session.phase === 'PreEndOfGame' ||
        this._lcData.gameflow.session.phase === 'EndOfGame' ||
        this._lcData.gameflow.session.phase === 'Reconnect')
    ) {
      return {
        phase: 'in-game' as 'champ-select' | 'in-game',
        gameInfo: {
          queueId: this._lcData.gameflow.session.gameData.queue.id,
          queueType: this._lcData.gameflow.session.gameData.queue.type,
          gameId: this._lcData.gameflow.session.gameData.gameId,
          gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
        }
      }
    }

    return {
      phase: 'unavailable' as const,
      gameInfo: null
    }
  }

  /**
   * 在游戏结算时，League Akari 会额外进行一些操作
   */
  get isInEog() {
    return (
      this._lcData.gameflow.phase === 'WaitingForStats' ||
      this._lcData.gameflow.phase === 'PreEndOfGame' ||
      this._lcData.gameflow.phase === 'EndOfGame'
    )
  }

  /**
   * teamParticipantId -> puuids
   *
   * 更加精准的队伍预测
   */
  get teamParticipantGroups() {
    if (!this._lcData.gameflow.session) {
      return {}
    }

    const groups: Record<string, string[]> = {}
    for (const p of [
      ...this._lcData.gameflow.session.gameData.teamOne,
      ...this._lcData.gameflow.session.gameData.teamTwo
    ]) {
      if (!groups[p.teamParticipantId]) {
        groups[p.teamParticipantId] = []
      }

      groups[p.teamParticipantId].push(p.puuid)
    }

    return groups
  }

  /**
   * 根据目前所有战绩计算出来的玩家分析数据
   */
  playerStats: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null = null

  setPlayerStats(
    value: {
      players: Record<string, MatchHistoryGamesAnalysisAll>
      teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
    } | null
  ) {
    this.playerStats = value
  }

  matchHistoryTagParams: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'> = {}

  setMatchHistoryTagParams(value: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'>) {
    this.matchHistoryTagParams = value
  }

  /**
   * 每名玩家的战绩
   * 手动同步
   */
  matchHistory: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      params: MatchHistoryQueryParams
      data: LcuOrSgpGameSummary[]
    }
  > = {}

  /**
   * 玩家战绩加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  matchHistoryLoadingState: Record<string, string> = {}

  setMatchHistoryLoadingState(player: string, state: string) {
    this.matchHistoryLoadingState = {
      ...this.matchHistoryLoadingState,
      [player]: state
    }
  }

  /**
   * 每名玩家的召唤师信息。目前一定是 LCU 格式
   */
  summoner: Record<string, SummonerInfo> = {}

  /**
   * 玩家召唤师信息加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  summonerLoadingState: Record<string, string> = {}

  /**
   * 每名玩家的段位。目前一定是 LCU 格式
   */
  rankedStats: Record<string, RankedStats> = {}

  /**
   * 玩家段位加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  rankedStatsLoadingState: Record<string, string> = {}

  /**
   * 每名玩家的段位
   * 手动同步
   */
  championMastery: Record<
    string,
    Record<
      number,
      {
        championId: number
        championLevel: number
        championPoints: number
      }
    >
  > = {}

  /**
   * 英雄成就加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  championMasteryLoadingState: Record<string, string> = {}

  /** 已经被记录在本地数据库中的信息 */
  savedInfo: Record<string, SavedPlayer> = {}

  /**
   * 已记录信息加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  savedInfoLoadingState: Record<string, string> = {}

  /** 或者说是 game 的 details，区分 summary (常见的战绩其实是 summary) */
  gameDetails: Record<number, LcuOrSgpGameDetails> = {}

  /**
   * 除了战绩中的对局外, 额外被加载的对局信息
   */
  additionalGame: Record<number, LcuOrSgpGameSummary> = {}

  // unused
  gameDetailsLoadingState: Record<number, string> = {}

  clear() {
    this.playerStats = null
    this.matchHistory = {}
    this.summoner = {}
    this.savedInfo = {}
    this.rankedStats = {}
    this.championMastery = {}
    this.matchHistoryTagParams = {}
    this.matchHistoryLoadingState = {}
    this.summonerLoadingState = {}
    this.savedInfoLoadingState = {}
    this.rankedStatsLoadingState = {}
    this.championMasteryLoadingState = {}
    this.gameDetailsLoadingState = {}
    this.gameDetails = {}
    this.additionalGame = {}
    this.additionalMembers = {}
  }

  /**
   * 置于一个草稿模式。草稿模式可在 unavailable 阶段被设置，用于自定义加载任何玩家战绩
   */
  draft: {
    teams: Record<string, string[]>
  } | null = null

  setDraft(
    value: {
      teams: Record<string, string[]>
    } | null
  ) {
    this.draft = value
  }

  get apiShouldUse() {
    if (
      this._appCommon.settings.preferredLolSource === 'sgp' &&
      this._sgp.state.availability.serversSupported.matchHistory
    ) {
      return 'sgp'
    }

    return 'lcu'
  }

  /** 结构同 teams  */
  additionalMembers: Record<string, string[]> = {}

  setAdditionalMembers(value: Record<string, string[]>) {
    this.additionalMembers = value
  }

  constructor(
    private readonly _lcData: LeagueClientData,
    private readonly _appCommon: AppCommonMain,
    private readonly _sgp: SgpMain
  ) {
    makeAutoObservable(this, {
      // shallow object
      matchHistory: observable.shallow,
      summoner: observable.shallow,
      rankedStats: observable.shallow,
      savedInfo: observable.shallow,
      championMastery: observable.shallow,
      gameDetails: observable.shallow,
      additionalGame: observable.shallow,

      // ref object, override only, no modification
      matchHistoryLoadingState: observable.ref,
      summonerLoadingState: observable.ref,
      rankedStatsLoadingState: observable.ref,
      savedInfoLoadingState: observable.ref,
      gameDetailsLoadingState: observable.ref,

      // structured data
      championSelections: computed.struct,
      positionAssignments: computed.struct,
      teams: computed.struct,
      playerStats: observable.struct,
      queryStage: computed.struct,
      teamParticipantGroups: computed.struct,
      draft: observable.struct,
      matchHistoryTagParams: observable.struct,
      additionalMembers: observable.struct
    })
  }
}
