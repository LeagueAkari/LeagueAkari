import { calculateCoefficientOfVariation, noZero, standardize } from '../utils'
import { MatchHistoryGamesAnalysisAll } from './players'

export interface MatchHistoryGamesAnalysisTeamSide {
  avgWinRate: number
  wins: number
  loses: number
  games: number
  kills: number
  deaths: number
  assists: number
  avgKda: number
  avgAkariScore: number
  akariScoreCv: number
  akariScoreBsi: number
}

export function analyzeTeamMatchHistory(
  analysisList: MatchHistoryGamesAnalysisAll[]
): MatchHistoryGamesAnalysisTeamSide | null {
  if (analysisList.length === 0) {
    return null
  }

  const kills = analysisList.reduce((acc, a) => acc + a.summary.kills, 0)
  const deaths = analysisList.reduce((acc, a) => acc + a.summary.deaths, 0)
  const assists = analysisList.reduce((acc, a) => acc + a.summary.assists, 0)
  const akariScore = analysisList.reduce((acc, a) => acc + a.akariScore.total, 0)
  const wins = analysisList.reduce((acc, a) => acc + a.summary.wins, 0)
  const loses = analysisList.reduce((acc, a) => acc + a.summary.losses, 0)
  const games = analysisList.reduce((acc, a) => acc + a.summary.count, 0)

  const sc = calculateCoefficientOfVariation(
    standardize(analysisList.map((a) => a.akariScore.total))
  )

  return {
    avgWinRate: wins / noZero(games),
    wins,
    loses,
    games,
    kills,
    deaths,
    assists,
    avgKda: (kills + assists) / noZero(deaths),
    avgAkariScore: akariScore / analysisList.length,
    akariScoreCv: calculateCoefficientOfVariation(
      standardize(analysisList.map((a) => a.akariScore.total))
    ),
    akariScoreBsi: akariScore / analysisList.length / (1 + sc)
  }
}
