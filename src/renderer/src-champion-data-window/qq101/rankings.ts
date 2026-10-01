import type { AkariResourceProviderValue } from '@renderer-shared/providers/akari-resource'
import type { Qq101ChampionDataOverview } from '@renderer-shared/shards/champion-data/qq101/types'

export type RankingBoard = 'champions' | 'augments' | 'synergies'
export interface RankingRow {
  key: string
  ids: number[]
  kind: 'champion' | 'augment' | 'pair'
  rank: number | null
  change: number | null
  winRate: number | null
  pickRate: number | null
  banRate?: number | null
  tier?: string | null
  position?: string
  rarity?: string
  winRank?: number | null
  winChange?: number | null
}

// QQ101 derives Mayhem tiers within each profession, before search or sorting.
function tierAt(index: number, total: number) {
  let boundary = 1
  for (const [tier, proportion] of [0.04, 0.15, 0.3, 0.4].entries()) {
    boundary = Math.max(boundary, Math.round(total * proportion))
    if (index < boundary) {
      return tier
    }
  }
  return 4
}

export function projectRankings(
  overview: Qq101ChampionDataOverview | null,
  board: RankingBoard,
  role: string,
  resources: AkariResourceProviderValue
): RankingRow[] {
  if (!overview) {
    return []
  }
  if (overview.mode === 'aram_mayhem' && board === 'augments') {
    return (overview.data.augments ?? []).map((row) => ({
      key: String(row.augmentId),
      ids: [row.augmentId],
      kind: 'augment',
      rank: row.pickRank,
      change: row.pickRankImprovement,
      winRank: row.winRank,
      winChange: row.winRankImprovement,
      winRate: row.winRate,
      pickRate: row.pickRate,
      rarity: resources.augments.display(row.augmentId)?.rarity
    }))
  }
  if (overview.mode === 'aram_mayhem' && board === 'synergies') {
    return (overview.data.synergies ?? []).map((row) => ({
      key: row.champions
        .map((hero) => hero.championId)
        .sort((a, b) => a - b)
        .join(':'),
      ids: row.champions.map((hero) => hero.championId),
      kind: 'pair',
      rank: row.rank,
      change: null,
      winRate: row.winRate,
      pickRate: row.pickRate
    }))
  }
  if (overview.mode === 'ranked' || overview.mode === 'classic') {
    return overview.data.champions.map((row) => ({
      key: `${row.championId}:${row.position}`,
      ids: ['classicChampionId' in row ? row.classicChampionId : row.championId],
      kind: 'champion' as const,
      rank: row.rank,
      change: row.rankChange,
      tier: row.strengthTier,
      position: row.position,
      winRate: row.winRate,
      pickRate: row.pickRate,
      banRate: row.banRate
    }))
  }

  const champions = [...overview.data.champions].sort(
    (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)
  )
  const tierByRole = new Map<string, Map<number, number>>()
  for (const profession of ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support']) {
    const members = champions.filter((row) =>
      resources.champions.roles(row.championId).includes(profession)
    )
    tierByRole.set(
      profession,
      new Map(members.map((row, index) => [row.championId, tierAt(index, members.length)]))
    )
  }
  return champions.flatMap((row, index) => {
    const roles = resources.champions.roles(row.championId)
    if (role !== 'all' && !roles.includes(role)) {
      return []
    }
    const tiers = (role === 'all' ? roles : [role]).flatMap((profession) => {
      const tier = tierByRole.get(profession)?.get(row.championId)
      return tier === undefined ? [] : [tier]
    })
    return [
      {
        key: String(row.championId),
        ids: [row.championId],
        kind: 'champion' as const,
        rank: row.rank,
        change: row.rankChange,
        winRate: row.winRate,
        pickRate: row.pickRate,
        tier:
          overview.mode === 'aram_mayhem'
            ? `T${tiers.length ? Math.min(...tiers) : tierAt(index, champions.length)}`
            : null
      }
    ]
  })
}
