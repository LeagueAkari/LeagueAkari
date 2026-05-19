import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  AdditionalResult,
  DraftOptions,
  OngoingGameAnalysis,
  OngoingGameSimplifiedChampMastery
} from '@shared/types/shards/ongoing-game'
import { SavedInfo } from '@shared/types/shards/saved-player'
import { removeSubsets } from '@shared/utils/team-up-calc'
import { computed, makeAutoObservable, observable } from 'mobx'

import { AppCommonMain } from '../app-common'
import { LeagueClientData } from '../league-client/lc-state'
import { RemoteConfigMain } from '../remote-config'
import { SgpMain } from '../sgp'
import {
  getDraftChampionSelections,
  getDraftPositionAssignments,
  getDraftQueryStage,
  getDraftTeams,
  getLiveChampionSelections,
  getLivePositionAssignments,
  getLiveQueryStage,
  getLiveTeamParticipantGroups,
  getLiveTeams
} from './computed-state'

export class OngoingGameSettings {
  enabled: boolean = true
  matchHistoryLoadCount: number = 50

  /**
   * 会拉取战绩中前 n 局的时间线数量
   */
  gameDetailsLoadCount: number = 20

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
  showJunglePathingForAllPlayers = false
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

  /**
   * 是否在 lobby 阶段查询战绩
   */
  queryInLobbyPhase = true

  /**
   * 推测预组队时，需要至少多少局游戏才能被推测
   */
  premadeTeamInferMatchCountThreshold: number = 5

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

  setShowJunglePathingForAllPlayers(value: boolean) {
    this.showJunglePathingForAllPlayers = value
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

  setQueryInLobbyPhase(value: boolean) {
    this.queryInLobbyPhase = value
  }

  setPremadeTeamInferMatchCountThreshold(value: number) {
    this.premadeTeamInferMatchCountThreshold = value
  }

  constructor() {
    makeAutoObservable(this, {
      playerCardTags: observable.ref
    })
  }
}

export class OngoingGameState {
  get championSelections() {
    if (this.draft) {
      return getDraftChampionSelections(this.draft)
    }

    return getLiveChampionSelections({
      data: this._data,
      queryStage: this.queryStage,
      additional: this.additional,
      config: this._rc.state.ongoingGameConfig
    })
  }

  get positionAssignments() {
    if (this.draft) {
      return getDraftPositionAssignments(this.draft)
    }

    return getLivePositionAssignments({
      data: this._data,
      queryStage: this.queryStage,
      additional: this.additional,
      config: this._rc.state.ongoingGameConfig
    })
  }

  get teams() {
    if (this.draft) {
      return getDraftTeams(this.draft)
    }

    return getLiveTeams({
      data: this._data,
      settings: this._settings,
      queryStage: this.queryStage,
      additional: this.additional,
      config: this._rc.state.ongoingGameConfig
    })
  }

  get queryStage() {
    if (this.draft) {
      return getDraftQueryStage(this.draft)
    }

    return getLiveQueryStage({
      data: this._data,
      settings: this._settings
    })
  }

  get isInEog() {
    return (
      this._data.gameflow.phase === 'WaitingForStats' ||
      this._data.gameflow.phase === 'PreEndOfGame' ||
      this._data.gameflow.phase === 'EndOfGame'
    )
  }

  get teamParticipantGroups() {
    if (this.draft) {
      return {}
    }

    return getLiveTeamParticipantGroups({
      data: this._data,
      additional: this.additional
    })
  }

  analysis: OngoingGameAnalysis | null = null

  setAnalysis(value: OngoingGameAnalysis | null) {
    this.analysis = value
  }

  matchHistoryTagParams: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'> = {}

  setMatchHistoryTagParams(value: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'>) {
    this.matchHistoryTagParams = value
  }

  matchHistory: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      params: MatchHistoryQueryParams
      data: LcuOrSgpGameSummary[]
    }
  > = {}

  matchHistoryLoadingState: Record<string, string> = {}

  setMatchHistoryLoadingState(player: string, state: string) {
    this.matchHistoryLoadingState = {
      ...this.matchHistoryLoadingState,
      [player]: state
    }
  }

  summoner: Record<string, SummonerInfo> = {}
  summonerLoadingState: Record<string, string> = {}
  rankedStats: Record<string, RankedStats> = {}
  rankedStatsLoadingState: Record<string, string> = {}
  championMastery: Record<string, Record<number, OngoingGameSimplifiedChampMastery>> = {}
  championMasteryLoadingState: Record<string, string> = {}
  savedInfo: Record<string, SavedInfo> = {}
  savedInfoLoadingState: Record<string, string> = {}
  gameDetails: Record<number, LcuOrSgpGameDetails> = {}
  additionalGame: Record<number, LcuOrSgpGameSummary> = {}
  gameDetailsLoadingState: Record<number, string> = {}
  inferredPremadeTeams: string[][] = []

  setInferredPremadeTeams(value: string[][]) {
    this.inferredPremadeTeams = value
  }

  clear(options?: { keepTagParams?: boolean; keepAdditionalInfo?: boolean }) {
    this.analysis = null
    this.matchHistory = {}
    this.summoner = {}
    this.savedInfo = {}
    this.rankedStats = {}
    this.championMastery = {}
    this.matchHistoryLoadingState = {}
    this.summonerLoadingState = {}
    this.savedInfoLoadingState = {}
    this.rankedStatsLoadingState = {}
    this.championMasteryLoadingState = {}
    this.gameDetailsLoadingState = {}
    this.gameDetails = {}
    this.additionalGame = {}
    this.inferredPremadeTeams = []

    if (!options?.keepAdditionalInfo) {
      this.clearAdditional()
    }

    if (!options?.keepTagParams) {
      this.matchHistoryTagParams = {}
    }
  }

  draft: DraftOptions | null = null

  setDraft(value: DraftOptions | null) {
    this.draft = value
  }

  get mergedPremadeTeamMap() {
    const teamIdentifierMap: Record<string, string> = {}
    for (const [teamIdentifier, puuids] of Object.entries(this.teams)) {
      for (const puuid of puuids) {
        teamIdentifierMap[puuid] = teamIdentifier
      }
    }

    let assignedTeamIndex = 0
    const premadeTeamMap: Record<string, number> = {}
    const participationGroups = Object.values(this.teamParticipantGroups)
    const inferredGroups = this.inferredPremadeTeams

    const simplified = removeSubsets(
      [...participationGroups, ...inferredGroups].filter((team) => team.length > 1),
      (team) => team
    )

    for (const puuids of simplified) {
      if (puuids.some((puuid) => teamIdentifierMap[puuid] !== teamIdentifierMap[puuids[0]])) {
        continue
      }

      const index = ++assignedTeamIndex
      for (const puuid of puuids) {
        premadeTeamMap[puuid] = index
      }
    }

    return premadeTeamMap
  }

  get apiShouldUse() {
    if (
      this._app.settings.preferredLolSource === 'sgp' &&
      this._sgp.state.availability.serversSupported.matchHistory
    ) {
      return 'sgp'
    }

    return 'lcu'
  }

  additional: AdditionalResult = {
    teams: {},
    selections: {},
    teamParticipantGroups: {},
    spells: {},
    positions: {}
  }

  setAdditional(value: AdditionalResult) {
    this.additional = value
  }

  clearAdditional() {
    this.additional = {
      teams: {},
      selections: {},
      teamParticipantGroups: {},
      spells: {},
      positions: {}
    }
  }

  constructor(
    private readonly _data: LeagueClientData,
    private readonly _app: AppCommonMain,
    private readonly _sgp: SgpMain,
    private readonly _settings: OngoingGameSettings,
    private readonly _rc: RemoteConfigMain
  ) {
    makeAutoObservable(this, {
      matchHistory: observable.shallow,
      summoner: observable.shallow,
      rankedStats: observable.shallow,
      savedInfo: observable.shallow,
      championMastery: observable.shallow,
      gameDetails: observable.shallow,
      additionalGame: observable.shallow,
      matchHistoryLoadingState: observable.ref,
      summonerLoadingState: observable.ref,
      rankedStatsLoadingState: observable.ref,
      savedInfoLoadingState: observable.ref,
      gameDetailsLoadingState: observable.ref,
      championSelections: computed.struct,
      positionAssignments: computed.struct,
      teams: computed.struct,
      analysis: observable.struct,
      queryStage: computed.struct,
      teamParticipantGroups: computed.struct,
      draft: observable.struct,
      matchHistoryTagParams: observable.struct,
      additional: observable.struct,
      inferredPremadeTeams: observable.struct,
      mergedPremadeTeamMap: computed.struct
    })
  }
}
