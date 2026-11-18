import type { HextechAugmentLabel, HextechAugmentSnapshot } from '@shared/types/hextech-augment'

export function getTopAugmentIds(labels: HextechAugmentLabel[]): Set<number> {
  if (labels.some((label) => label.id === null)) return new Set()
  const tier = ['S', 'A', 'B', 'C', 'D', 'E', 'F'].find((tier) =>
    labels.some((label) => label.tier === tier)
  )
  const candidates = labels.filter((label) => label.tier === tier)
  if (candidates.length === 1) return new Set([candidates[0].id!])
  if (!candidates.length || candidates.some((label) => label.tierRank == null)) return new Set()
  const rank = Math.min(...candidates.map((label) => label.tierRank!))
  return new Set(candidates.filter((label) => label.tierRank === rank).map((label) => label.id!))
}

export function getRankBars(label: HextechAugmentLabel): number {
  if (label.tierRank == null || !label.tierCount) return 0
  return Math.max(1, 3 - Math.floor(((label.tierRank - 1) * 3) / label.tierCount))
}

export function getChangedAugmentIds(
  previous: HextechAugmentSnapshot | null,
  current: HextechAugmentSnapshot | null
): number[] {
  if (!previous || !current || previous.championId !== current.championId) return []
  return current.labels
    .filter((label, slot) => label.id !== null && label.id !== previous.labels[slot]?.id)
    .map((label) => label.id!)
}
