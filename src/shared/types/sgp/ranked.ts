export interface SgpRankedStats {
  queues: Queue[]
  highestPreviousSeasonEndTier: string
  highestPreviousSeasonEndRank: string
  highestPreviousSeasonAchievedTier: string
  highestPreviousSeasonAchievedRank: string
  earnedRegaliaRewardIds: any[]
  currentSeasonSplitPoints: number
  previousSeasonSplitPoints: number
  seasons: Seasons
}

interface Seasons {
  RANKED_TFT: RANKEDTFT
  RANKED_TFT_TURBO: RANKEDTFT
  CHERRY: RANKEDTFT
  RANKED_FLEX_SR: RANKEDTFT
  RANKED_TFT_DOUBLE_UP: RANKEDTFT
  RANKED_SOLO_5x5: RANKEDTFT
}

interface RANKEDTFT {
  currentSeasonId: number
  currentSeasonEnd: number
  nextSeasonStart: number
}

interface Queue {
  queueType: string
  provisionalGameThreshold: number
  tier?: string
  rank?: string
  leaguePoints: number
  cumulativeLp: number
  wins: number
  losses: number
  provisionalGamesRemaining: number
  highestTier?: string
  highestRank?: string
  previousSeasonEndTier?: string
  previousSeasonEndRank?: string
  previousSeasonHighestTier?: string
  previousSeasonHighestRank?: string
  previousSeasonAchievedTier?: string
  previousSeasonAchievedRank?: string
  ratedRating: number
  premadeMmrRestricted: boolean
  ratedTier?: string
}
