import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { MatchHistoryGamesAnalysisTeamSide } from '@shared/data-adapter/analysis/teams'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { AdditionalResult, QueryStage } from '@shared/types/shards/ongoing-game'
import { SavedInfo } from '@shared/types/shards/saved-player'
import { ParsedRole } from '@shared/utils/ranked'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export interface MatchHistoryPlayer {
  source: 'lcu' | 'sgp'
  params: MatchHistoryQueryParams
  data: LcuOrSgpGameSummary[]
}

export const useOngoingGameStore = defineStore('shard:ongoing-game-renderer', () => {
  const settings = shallowReactive({
    enabled: true,
    matchHistoryLoadCount: 20,
    concurrency: 3,
    matchHistoryTagPreference: 'current' as 'current' | 'all',
    gameDetailsLoadCount: 0,
    premadeTeamInferMatchCountThreshold: 5,

    orderPlayerBy: 'default' as
      | 'win-rate'
      | 'kda'
      | 'default'
      | 'akari-score'
      | 'position'
      | 'premade-team',

    showChampionUsage: 'recent' as 'recent' | 'mastery' | 'none',
    showMatchHistoryItemBorder: false,
    autoRouteWhenGameStarts: false,
    playerCardTags: {
      showPremadeTeamTag: true,
      showSuspiciousFlashPositionTag: true,
      showWinningStreakTag: true,
      showLosingStreakTag: true,
      showSoloKillsTag: false,
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
    },
    queryInLobbyPhase: false
  })

  const championSelections = shallowRef<Record<string, number>>({})
  const positionAssignments = shallowRef<
    Record<
      string,
      {
        position: string
        role: ParsedRole | null
      }
    >
  >({})
  const teams = shallowRef<Record<string, string[]>>({})

  // untyped
  const queryStage = shallowRef<QueryStage>({ phase: 'unavailable', gameInfo: null })
  const isInEog = shallowRef(false)

  const playerStats = shallowRef<{
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null>(null)

  const matchHistoryTagParams = shallowRef<Pick<
    MatchHistoryQueryParams,
    'tag' | 'tagsQueryType'
  > | null>(null)

  const matchHistory = ref<Record<string, MatchHistoryPlayer>>({})
  const summoner = ref<Record<string, SummonerInfo>>({})
  const rankedStats = ref<Record<string, RankedStats>>({})
  const championMastery = ref<Record<string, Record<number, Mastery>>>({})
  const savedInfo = ref<Record<string, SavedInfo>>({})

  const cachedGames = ref<Record<number, LcuOrSgpGameSummary>>({})

  const matchHistoryLoadingState = ref<Record<string, string>>({})

  const summonerLoadingState = ref<Record<string, string>>({}) // 未实装
  const savedInfoLoadingState = ref<Record<string, string>>({}) // 未实装
  const rankedStatsLoadingState = ref<Record<string, string>>({}) // 未实装
  const championMasteryLoadingState = ref<Record<string, string>>({}) // 未实装

  const teamParticipantGroups = shallowRef<Record<string, string[]>>({})
  const calculatedPremadeTeamMap = shallowRef<Record<string, number>>({})
  const inferredPremadeTeams = shallowRef<
    {
      puuids: string[]
      times: number
      gameIds: number[]
    }[]
  >([])

  const draft = shallowRef<{
    teams: Record<string, string[]>
  } | null>(null)
  const additional = shallowRef<AdditionalResult>({
    teams: {},
    selections: {},
    teamParticipantGroups: {},
    spells: {},
    positions: {}
  })

  return {
    settings,

    championSelections,
    positionAssignments,
    teams,
    queryStage,
    isInEog,
    playerStats,
    matchHistoryTagParams,

    matchHistory,
    summoner,
    rankedStats,
    championMastery,
    savedInfo,

    cachedGames,

    matchHistoryLoadingState,
    summonerLoadingState,
    savedInfoLoadingState,
    rankedStatsLoadingState,
    championMasteryLoadingState,
    teamParticipantGroups,
    additional,
    draft,
    calculatedPremadeTeamMap,
    inferredPremadeTeams
  }
})
