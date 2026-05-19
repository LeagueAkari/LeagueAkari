import { calculateCoefficientOfVariation, noZero, standardize } from '@shared/data-adapter/utils'

import { AggregatedAnalysis } from '../player'

export interface AggregatedTeamAnalysis {
  avgWinRate: number
  wins: number
  losses: number
  games: number
  kills: number
  deaths: number
  assists: number
  avgKda: number
  avgAkariScore: number
  akariScoreCv: number
  akariScoreBsi: number
}

export function analyzePlayers(
  playerAnalyses: AggregatedAnalysis[]
): AggregatedTeamAnalysis | null {
  if (playerAnalyses.length === 0) {
    return null
  }

  const kills = playerAnalyses.reduce((acc, a) => acc + a.summary.kills, 0)
  const deaths = playerAnalyses.reduce((acc, a) => acc + a.summary.deaths, 0)
  const assists = playerAnalyses.reduce((acc, a) => acc + a.summary.assists, 0)
  const akariScore = playerAnalyses.reduce((acc, a) => acc + a.akariScore.total, 0)
  const wins = playerAnalyses.reduce((acc, a) => acc + a.winLoss.all.wins, 0)
  const losses = playerAnalyses.reduce((acc, a) => acc + a.winLoss.all.losses, 0)
  const games = playerAnalyses.reduce((acc, a) => acc + a.count, 0)

  const sc = calculateCoefficientOfVariation(
    standardize(playerAnalyses.map((a) => a.akariScore.total))
  )

  return {
    avgWinRate: wins / noZero(games),
    wins,
    losses,
    games,
    kills,
    deaths,
    assists,
    avgKda: (kills + assists) / noZero(deaths),
    avgAkariScore: akariScore / playerAnalyses.length,
    akariScoreCv: calculateCoefficientOfVariation(
      standardize(playerAnalyses.map((a) => a.akariScore.total))
    ),
    akariScoreBsi: akariScore / playerAnalyses.length / (1 + sc)
  }
}
