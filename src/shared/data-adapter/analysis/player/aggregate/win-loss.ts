import { getCherryTeamCount, isCherryPlacementWin } from '../../../match-history/cherry'
import { noZero } from '../../../utils'
import { ACTIVE_SESSION_GAP_MS, ACTIVE_SESSION_LATEST_WINDOW_MS } from '../constants'
import type {
  AggregatedCherryWinLossAnalysis,
  AggregatedWinLossAnalysis,
  AggregatedWinLossAnalysisMap
} from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import { emptyCherryWinLoss, emptyWinLoss } from '../utils/empty'

export function computeAggregatedWinLoss(games: PreparedGame[]): AggregatedWinLossAnalysis {
  const count = games.length
  if (count === 0) return emptyWinLoss()

  let wins = 0
  let losses = 0
  for (const g of games) {
    if (g.participant.winResult === 'win') wins++
    else if (g.participant.winResult === 'loss') losses++
  }

  let winningStreak = 0
  let losingStreak = 0
  for (const g of games) {
    const r = g.participant.winResult
    if (r === 'win') {
      if (losingStreak > 0) break
      winningStreak += 1
      continue
    }
    if (winningStreak > 0) break
    losingStreak += 1
  }

  let activeSessionWins = 0
  let activeSessionLosses = 0
  const latest = games[0]
  let lastGameEndedAt = latest.basic.gameCreation + latest.basic.gameDuration * 1000
  if (Date.now() - lastGameEndedAt < ACTIVE_SESSION_LATEST_WINDOW_MS) {
    activeSessionWins = latest.participant.winResult === 'win' ? 1 : 0
    activeSessionLosses = latest.participant.winResult === 'loss' ? 1 : 0
    for (let i = 1; i < games.length; i++) {
      const cur = games[i]
      if (lastGameEndedAt - cur.basic.gameCreation > ACTIVE_SESSION_GAP_MS) break
      if (cur.participant.winResult === 'win') activeSessionWins += 1
      else if (cur.participant.winResult === 'loss') activeSessionLosses += 1
      lastGameEndedAt = cur.basic.gameCreation + cur.basic.gameDuration * 1000
    }
  }

  return {
    count,
    activeSessionWins,
    activeSessionLosses,
    wins,
    losses,
    winRate: wins / noZero(count),
    winningStreak,
    losingStreak
  }
}

export function computeAggregatedCherryWinLoss(
  games: PreparedGame[]
): AggregatedCherryWinLossAnalysis {
  const base = computeAggregatedWinLoss(games)
  if (games.length === 0) return emptyCherryWinLoss()

  let top1s = 0
  let topHalfFinishes = 0
  let placementSum = 0
  let placementSamples = 0
  for (const g of games) {
    const placement = g.participant.subteamPlacement
    const teamCount = getCherryTeamCount(g.participants)

    if (placement === 1) top1s++
    if (isCherryPlacementWin(placement, teamCount)) topHalfFinishes++
    if (placement > 0) {
      placementSum += placement
      placementSamples += 1
    }
  }

  return {
    ...base,
    top1s,
    topHalfFinishes,
    top1Rate: top1s / noZero(base.count),
    topHalfRate: topHalfFinishes / noZero(base.count),
    avgSubteamPlacement: placementSamples > 0 ? placementSum / placementSamples : 0
  }
}

export function computeAggregatedWinLossMap(games: PreparedGame[]): AggregatedWinLossAnalysisMap {
  const cherryGames = games.filter((g) => g.basic.gameMode === 'CHERRY')
  const normalGames = games.filter((g) => g.basic.gameMode !== 'CHERRY')
  return {
    all: computeAggregatedWinLoss(games),
    normal: computeAggregatedWinLoss(normalGames),
    cherry: computeAggregatedCherryWinLoss(cherryGames)
  }
}
