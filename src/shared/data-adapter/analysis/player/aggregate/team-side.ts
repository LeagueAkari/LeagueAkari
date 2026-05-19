import type { AggregatedTeamSideAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'

export function computeAggregatedTeamSide(games: PreparedGame[]): AggregatedTeamSideAnalysis {
  let blueSideCount = 0
  let redSideCount = 0
  for (const g of games) {
    if (g.participant.teamIdentifier === 'TEAM-100') blueSideCount++
    else if (g.participant.teamIdentifier === 'TEAM-200') redSideCount++
  }
  return { blueSideCount, redSideCount }
}
