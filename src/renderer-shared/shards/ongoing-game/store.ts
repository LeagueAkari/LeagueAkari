import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import type { AggregatedTeamAnalysis } from '@shared/data-adapter/analysis/team'
import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import type {
  AdditionalResult,
  DraftOptions,
  OngoingGameSettingsData,
  OngoingGameSimplifiedChampMastery,
  QueryStage
} from '@shared/shards/ongoing-game'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import type { SavedInfo } from '@shared/shards/saved-player'
import type { RankedStats } from '@shared/types/league-client/ranked'
import type { SummonerInfo } from '@shared/types/league-client/summoner'
import type { ParsedRole } from '@shared/utils/ranked'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export interface MatchHistoryPlayer {
  source: 'lcu' | 'sgp'
  params: MatchHistoryQueryParams
  data: LcuOrSgpGameSummary[]
}

export const useOngoingGameStore = defineStore('shard:ongoing-game-renderer', () => {
  const settings = shallowReactive<OngoingGameSettingsData>({
    enabled: true,
    matchHistoryLoadCount: 50,
    concurrency: 4,
    matchHistoryTagPreference: 'current',
    gameDetailsLoadCount: 20,
    premadeTeamInferMatchCountThreshold: 5,

    orderPlayerBy: 'default',

    showChampionUsage: 'recent',
    showMatchHistoryItemBorder: false,
    showJunglePathing: true,
    showJunglePathingForAllPlayers: false,
    autoRouteWhenGameStarts: false,
    playerCardTags: createDefaultOngoingGamePanelPlayerCardTagSettings(),
    queryInLobbyPhase: true
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

  const analysis = shallowRef<{
    players: Record<string, AggregatedAnalysis>
    teams: Record<string, AggregatedTeamAnalysis>
  } | null>(null)

  const matchHistoryTagParams = shallowRef<Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'>>(
    {}
  )

  const matchHistory = ref<Record<string, MatchHistoryPlayer>>({})
  const summoner = ref<Record<string, SummonerInfo>>({})
  const rankedStats = ref<Record<string, RankedStats>>({})
  const championMastery = ref<Record<string, Record<number, OngoingGameSimplifiedChampMastery>>>({})
  const savedInfo = ref<Record<string, SavedInfo>>({})

  const cachedGames = ref<Record<number, LcuOrSgpGameSummary>>({})
  const gameDetails = ref<Record<number, LcuOrSgpGameDetails>>({})

  const matchHistoryLoadingState = ref<Record<string, string>>({})

  const summonerLoadingState = ref<Record<string, string>>({}) // 未实装
  const savedInfoLoadingState = ref<Record<string, string>>({}) // 未实装
  const rankedStatsLoadingState = ref<Record<string, string>>({}) // 未实装
  const championMasteryLoadingState = ref<Record<string, string>>({}) // 未实装

  const teamParticipantGroups = shallowRef<Record<string, string[]>>({})
  const mergedPremadeTeamMap = shallowRef<Record<string, number>>({})
  const inferredPremadeTeams = shallowRef<string[][]>([])

  const draft = shallowRef<DraftOptions | null>(null)
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
    analysis,
    matchHistoryTagParams,

    matchHistory,
    summoner,
    rankedStats,
    championMastery,
    savedInfo,

    cachedGames,
    gameDetails,

    matchHistoryLoadingState,
    summonerLoadingState,
    savedInfoLoadingState,
    rankedStatsLoadingState,
    championMasteryLoadingState,
    teamParticipantGroups,
    additional,
    draft,
    mergedPremadeTeamMap,
    inferredPremadeTeams
  }
})
