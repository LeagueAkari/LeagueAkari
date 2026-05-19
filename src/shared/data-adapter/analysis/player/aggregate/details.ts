import { noZero } from '../../../utils'
import type { AggregatedDetailsAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'

export function computeAggregatedDetails(games: PreparedGame[]): AggregatedDetailsAnalysis | null {
  if (!games.some((g) => g.single.details !== null)) return null

  const earlyDeathsWithEnemyJunglerInvolvedSamples: number[] = []
  for (const g of games) {
    const v = g.single.details?.earlyDeathsWithEnemyJunglerInvolved
    if (v !== null && v !== undefined) earlyDeathsWithEnemyJunglerInvolvedSamples.push(v)
  }

  return {
    avgEarlyDeathsWithEnemyJunglerInvolved:
      earlyDeathsWithEnemyJunglerInvolvedSamples.length === 0
        ? null
        : earlyDeathsWithEnemyJunglerInvolvedSamples.reduce((s, v) => s + v, 0) /
          noZero(earlyDeathsWithEnemyJunglerInvolvedSamples.length)
  }
}
