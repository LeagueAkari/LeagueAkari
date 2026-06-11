import type { AggregatedChampionAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import { computeAggregatedJungle } from './jungle'
import { computeAggregatedSummary } from './summary'
import { computeAggregatedWinLossMap } from './win-loss'

export function computeAggregatedChampions(
  games: PreparedGame[]
): Record<number, AggregatedChampionAnalysis> {
  const byChampion = new Map<number, PreparedGame[]>()
  for (const g of games) {
    const id = g.participant.championId
    if (id === 0) continue
    const list = byChampion.get(id)
    if (list) list.push(g)
    else byChampion.set(id, [g])
  }

  const out: Record<number, AggregatedChampionAnalysis> = {}
  for (const [id, list] of byChampion) {
    out[id] = {
      championId: id,
      summary: computeAggregatedSummary(list),
      winLoss: computeAggregatedWinLossMap(list),
      jungle: computeAggregatedJungle(list)
    }
  }
  return out
}
