export type ChampionDataSourceId = 'opgg' | 'qq101'

export type ChampionDataMode =
  'ranked' | 'classic' | 'aram' | 'aram_mayhem' | 'arena' | 'nexus_blitz' | 'urf'

export type ChampionDataPosition =
  'all' | 'top' | 'jungle' | 'middle' | 'bottom' | 'utility' | 'none'

export type ChampionDataFilter = 'region' | 'patch' | 'tier' | 'position'

export type ChampionDataFeature =
  | 'champion-overview'
  | 'champion-summary'
  | 'matchups'
  | 'synergies'
  | 'summoner-spells'
  | 'ability-builds'
  | 'item-builds'
  | 'rune-pages'
  | 'champion-augments'
  | 'augment-overview'
  | 'synergy-overview'
  | 'position-stats'
  | 'patch-trends'
  | 'tier-stats'
  | 'duration-stats'

export type ChampionDataAbility = 'Q' | 'W' | 'E' | 'R' | (string & {})

export interface ChampionDataQuery {
  source?: ChampionDataSourceId
  mode: ChampionDataMode
  region?: string
  patch?: string
  tier?: string | number
  position?: ChampionDataPosition
}

export type ChampionDataFallbackReason = 'source-disabled' | 'mode-unsupported' | 'request-failed'

export interface ChampionDataLoadAttempt {
  source: ChampionDataSourceId
  outcome: 'disabled' | 'mode-unsupported' | 'failed' | 'success'
  message: string | null
}

export type ChampionDataLoadResult<T> =
  | {
      status: 'success'
      data: T
      preferredSource: ChampionDataSourceId
      effectiveSource: ChampionDataSourceId
      fallbackReason: ChampionDataFallbackReason | null
      attempts: ChampionDataLoadAttempt[]
    }
  | {
      status: 'unavailable'
      data: null
      preferredSource: ChampionDataSourceId
      effectiveSource: null
      fallbackReason: ChampionDataFallbackReason
      attempts: ChampionDataLoadAttempt[]
    }

export interface ChampionDataSourceAvailability {
  preferredSource: ChampionDataSourceId
  sources: Record<ChampionDataSourceId, { enabled: boolean }>
}

export interface ChampionDataPreferences {
  mode: ChampionDataMode
  position: ChampionDataPosition
  region: string
  tier: string | number
}

export interface ChampionDataMetadata {
  source: ChampionDataSourceId
  mode: ChampionDataMode
  patch: string | null
  dataDate: string | null
  updatedAt: string | null
}

export interface ChampionPerformance {
  games: number | null
  wins: number | null
  winRate: number | null
  pickRate: number | null
  banRate: number | null
  kda: number | null
  rank: number | null
  rankChange: number | null
  strengthTier: string | number | null
  averagePlacement: number | null
  firstPlaceRate: number | null
}

export interface ChampionOverviewItem {
  championId: number
  position: ChampionDataPosition
  performance: ChampionPerformance
  counterChampionIds: number[]
  mayhem?: {
    averageDeathTimeSeconds: number | null
    killParticipationRate: number | null
    damageShare: number | null
    damageTakenShare: number | null
    lowestRankAugmentIds: number[]
  }
}

export interface ChampionDataOverview {
  metadata: ChampionDataMetadata
  sections: {
    champions: ChampionOverviewItem[]
    augments?: ChampionAugment[]
    synergies?: ChampionSynergy[]
  }
}

export interface ChampionDataDetails {
  metadata: ChampionDataMetadata
  championId: number
  summary: ChampionOverviewItem
  sections: {
    matchups?: ChampionMatchup[]
    synergies?: ChampionSynergy[]
    summonerSpells?: ChampionSummonerSpellRecommendation[]
    abilityBuilds?: ChampionAbilityBuild[]
    itemBuilds?: ChampionItemBuildSlot[]
    runePages?: ChampionRunePage[]
    augments?: ChampionAugment[]
    positions?: ChampionPositionStats[]
    trends?: ChampionTrendPoint[]
    tiers?: ChampionTierStats[]
    durations?: ChampionDurationStats[]
  }
}

export interface ChampionRecommendationPerformance {
  games: number | null
  wins: number | null
  winRate: number | null
  pickRate: number | null
  rank: number | null
  averagePlacement: number | null
  firstPlaceRate: number | null
}

export interface ChampionMatchup {
  championId: number
  relationship: 'favorable' | 'unfavorable' | 'unknown'
  performance: ChampionRecommendationPerformance
}

export interface ChampionSynergy {
  championIds: number[]
  performance: ChampionRecommendationPerformance
}

export interface ChampionSummonerSpellRecommendation {
  spellIds: number[]
  performance: ChampionRecommendationPerformance
}

export type ChampionItemBuildSlotName =
  'starting' | 'boots' | 'core' | 'fourth' | 'fifth' | 'sixth' | 'last' | 'prism'

export interface ChampionItemBuildSlot {
  slot: ChampionItemBuildSlotName
  options: Array<{
    itemIds: number[]
    performance: ChampionRecommendationPerformance
  }>
}

export interface ChampionRunePage {
  primaryStyleId: number | null
  secondaryStyleId: number | null
  primaryRuneIds: number[]
  secondaryRuneIds: number[]
  statShardIds: number[]
  performance: ChampionRecommendationPerformance
}

export interface ChampionAbilityBuild {
  abilityPriority: ChampionDataAbility[]
  levelOrder: ChampionDataAbility[]
  performance: ChampionRecommendationPerformance
}

export interface ChampionAugment {
  augmentId: number
  tier: number | null
  rank: number | null
  rankChange: number | null
  performanceScore: number | null
  performance: ChampionRecommendationPerformance
  popularity: number | null
  bestChampionIds: number[]
}

export interface ChampionPositionStats {
  position: ChampionDataPosition
  share: number | null
  performance: ChampionPerformance
}

export interface ChampionTrendPoint {
  patch: string
  winRate: number | null
  pickRate: number | null
  banRate: number | null
  rank: number | null
}

export interface ChampionTierStats {
  tierId: string | number
  winRate: number | null
  pickRate: number | null
  banRate: number | null
}

export interface ChampionDurationStats {
  range: string
  winRate: number | null
  rank: number | null
}
