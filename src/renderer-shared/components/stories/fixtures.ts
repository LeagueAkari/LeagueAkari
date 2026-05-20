import type { MapLanePoint } from '@renderer-shared/components/ongoing-game-panel/widgets/player-info-card/jungle-pathing-info/types'
import type { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'

const rankedEntry = (
  entry: Partial<RankedEntry> & Pick<RankedEntry, 'queueType'>
): RankedEntry => ({
  currentSeasonWinsForRewards: 0,
  division: 'NA',
  highestDivision: 'NA',
  highestTier: 'NA',
  isProvisional: false,
  leaguePoints: 0,
  losses: 0,
  miniSeriesProgress: '',
  previousSeasonEndDivision: 'NA',
  previousSeasonEndTier: 'NA',
  previousSeasonHighestDivision: 'NA',
  previousSeasonHighestTier: 'NA',
  previousSeasonWinsForRewards: 0,
  provisionalGameThreshold: 0,
  provisionalGamesRemaining: 0,
  ratedRating: 0,
  ratedTier: 'NA',
  tier: 'NA',
  wins: 0,
  ...entry
})

const soloQueue = rankedEntry({
  queueType: 'RANKED_SOLO_5x5',
  tier: 'DIAMOND',
  division: 'II',
  leaguePoints: 64,
  wins: 138,
  losses: 119,
  previousSeasonEndTier: 'EMERALD',
  previousSeasonEndDivision: 'I',
  previousSeasonHighestTier: 'DIAMOND',
  previousSeasonHighestDivision: 'IV',
  highestTier: 'MASTER',
  highestDivision: 'I'
})

const flexQueue = rankedEntry({
  queueType: 'RANKED_FLEX_SR',
  tier: 'PLATINUM',
  division: 'I',
  leaguePoints: 28,
  wins: 41,
  losses: 37,
  previousSeasonEndTier: 'GOLD',
  previousSeasonEndDivision: 'II',
  previousSeasonHighestTier: 'PLATINUM',
  previousSeasonHighestDivision: 'III',
  highestTier: 'PLATINUM',
  highestDivision: 'I'
})

const tftQueue = rankedEntry({
  queueType: 'RANKED_TFT',
  previousSeasonEndTier: 'GOLD',
  previousSeasonEndDivision: 'IV',
  previousSeasonHighestTier: 'GOLD',
  previousSeasonHighestDivision: 'II',
  highestTier: 'PLATINUM',
  highestDivision: 'IV'
})

export const storyRankedStats: RankedStats = {
  currentSeasonSplitPoints: 0,
  earnedRegaliaRewardIds: [],
  highestCurrentSeasonReachedTierSR: 'MASTER',
  highestPreviousSeasonAchievedDivision: 'I',
  highestPreviousSeasonAchievedTier: 'DIAMOND',
  highestPreviousSeasonEndDivision: 'I',
  highestPreviousSeasonEndTier: 'EMERALD',
  highestRankedEntry: soloQueue,
  highestRankedEntrySR: soloQueue,
  previousSeasonSplitPoints: 0,
  queueMap: {
    RANKED_SOLO_5x5: soloQueue,
    RANKED_FLEX_SR: flexQueue,
    RANKED_TFT: tftQueue
  },
  queues: [soloQueue, flexQueue, tftQueue],
  rankedRegaliaLevel: 3,
  seasons: {},
  splitsProgress: {}
}

export const storyMapPoints = [
  { x: 13500, y: 3600 },
  { x: 11200, y: 7600 },
  { x: 7500, y: 7600 },
  { x: 3900, y: 11800 },
  { x: 9800, y: 10200 }
]

export const storyGankPositionPoints: MapLanePoint[] = [
  { x: 2800, y: 12300, lane: 'bot' },
  { x: 3700, y: 11100, lane: 'bot' },
  { x: 7300, y: 7600, lane: 'mid' },
  { x: 8800, y: 6600, lane: 'mid' },
  { x: 11300, y: 4100, lane: 'top' },
  { x: 12400, y: 3000, lane: 'top' }
]

export const storyGankKillPoints: MapLanePoint[] = [
  { x: 3400, y: 11600, lane: 'bot' },
  { x: 7900, y: 7300, lane: 'mid' },
  { x: 11900, y: 3500, lane: 'top' }
]
