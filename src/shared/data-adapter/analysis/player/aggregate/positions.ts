import type { PreparedGame } from '../types/helpers'

export interface AggregatedPositionAnalysis {
  TOP: number
  JUNGLE: number
  MIDDLE: number
  BOTTOM: number
  UTILITY: number
}

export function computeAggregatedPositions(
  games: PreparedGame[]
): AggregatedPositionAnalysis | null {
  if (!games[0]?.participant.position) {
    return null
  }

  const positions: AggregatedPositionAnalysis = {
    TOP: 0,
    JUNGLE: 0,
    MIDDLE: 0,
    BOTTOM: 0,
    UTILITY: 0
  }

  for (const { participant } of games) {
    if (participant.position) {
      positions[participant.position] += 1
    }
  }

  return positions
}
