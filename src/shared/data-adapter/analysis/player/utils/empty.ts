import type {
  AggregatedCherryWinLossAnalysis,
  AggregatedWinLossAnalysis
} from '../types/aggregated'
import type { JungleCamp } from '../types/helpers'

export function emptyWinLoss(): AggregatedWinLossAnalysis {
  return {
    count: 0,
    activeSessionWins: 0,
    activeSessionLosses: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    winningStreak: 0,
    losingStreak: 0
  }
}

export function emptyCherryWinLoss(): AggregatedCherryWinLossAnalysis {
  return {
    ...emptyWinLoss(),
    top1s: 0,
    topHalfFinishes: 0,
    top1Rate: 0,
    topHalfRate: 0,
    avgSubteamPlacement: 0
  }
}

export function emptyCampCount(): Record<JungleCamp, number> {
  return { red: 0, blue: 0, wolves: 0, raptors: 0 }
}
