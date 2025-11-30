import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { MatchHistoryGamesAnalysisTeamSide } from '@shared/data-adapter/analysis/teams'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { AdditionalTeamMembersResult } from '@shared/types/shards/ongoing-game'
import { ParsedRole } from '@shared/utils/ranked'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
export interface MatchHistoryPlayer {
  source: 'lcu' | 'sgp'
  params: MatchHistoryQueryParams
  data: LcuOrSgpGameSummary[]
}

// copied from main shard
interface EncounteredGame {
  id: number

  gameId: number

  puuid: string

  selfPuuid: string

  region: string

  rsoPlatformId: string

  updateAt: Date

  queueType: string
}

// copied from main shard
export interface SavedInfo {
  puuid: string

  selfPuuid: string

  region: string

  rsoPlatformId: string

  tag: string | null

  updateAt: Date

  lastMetAt: Date | null

  // copied from main shard
  tags: {
    markedBySelf: boolean
    puuid: string
    selfPuuid: string
    region: string
    rsoPlatformId: string
    tag: string | null
    updateAt: Date
    lastMetAt: Date | null
  }[]

  encounteredGames: {
    data: EncounteredGame[]
    page: number
    pageSize: number
    total: number
  }
}

// copied from main shard
export type QueryStage =
  | {
      phase: 'champ-select' | 'in-game'
      gameInfo: {
        queueId: number
        queueType: string
        gameId: number
        gameMode: string
      }
    }
  | {
      phase: 'unavailable'
      gameInfo: null
    }

export const useOngoingGameStore = defineStore('shard:ongoing-game-renderer', () => {
  const settings = shallowReactive({
    enabled: true,
    matchHistoryLoadCount: 20,
    concurrency: 3,
    matchHistoryTagPreference: 'current' as 'current' | 'all',
    gameDetailsLoadCount: 0,

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
      showSoloKillsTag: true,
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

  const draft = shallowRef<{
    teams: Record<string, string[]>
  } | null>(null)
  const additionalMembers = shallowRef<AdditionalTeamMembersResult>({
    teams: {},
    selections: {}
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
    additionalMembers,
    draft
  }
})
