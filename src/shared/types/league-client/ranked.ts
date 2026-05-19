export interface RankedTiers {
  achievedTiers: AchievedTier[]
  summonerId: number
}

export interface AchievedTier {
  division: number
  queueType: string
  tier: string
}

export interface RankedStats {
  currentSeasonSplitPoints: number
  earnedRegaliaRewardIds: any[]
  highestCurrentSeasonReachedTierSR: string
  highestPreviousSeasonAchievedDivision?: string
  highestPreviousSeasonAchievedTier?: string
  highestPreviousSeasonEndDivision: string
  highestPreviousSeasonEndTier: string
  highestRankedEntry: RankedEntry
  highestRankedEntrySR: RankedEntry
  previousSeasonSplitPoints: number
  queueMap: QueueMap
  queues: RankedEntry[]
  rankedRegaliaLevel: number
  seasons: Seasons
  splitsProgress: Record<string, number>
}

export interface Seasons {
  RANKED_FLEX_SR?: RankedSeasonInfo
  RANKED_SOLO_5x5?: RankedSeasonInfo
  RANKED_TFT?: RankedSeasonInfo
  RANKED_TFT_DOUBLE_UP?: RankedSeasonInfo
  RANKED_TFT_TURBO?: RankedSeasonInfo
}

export interface RankedSeasonInfo {
  currentSeasonEnd: number
  currentSeasonId: number
  nextSeasonStart: number
}

interface QueueMap {
  RANKED_FLEX_SR?: RankedEntry
  RANKED_SOLO_5x5?: RankedEntry
  RANKED_TFT?: RankedEntry
  RANKED_TFT_DOUBLE_UP?: RankedEntry
  RANKED_TFT_TURBO?: RankedEntry
}

export interface RankedEntry {
  climbingIndicatorActive?: boolean
  currentSeasonWinsForRewards: number
  division: string
  highestDivision: string
  highestTier: string
  isProvisional: boolean
  leaguePoints: number
  losses: number
  miniSeriesProgress: string
  previousSeasonAchievedDivision?: string
  previousSeasonAchievedTier?: string
  previousSeasonEndDivision: string
  previousSeasonEndTier: string
  previousSeasonWinsForRewards: number
  provisionalGameThreshold: number
  provisionalGamesRemaining: number
  previousSeasonHighestTier: string
  previousSeasonHighestDivision: string
  queueType: string
  ratedRating: number
  ratedTier: string
  tier: string
  warnings?: any
  wins: number
}
