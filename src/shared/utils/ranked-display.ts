import { RankedEntry } from '@shared/types/league-client/ranked'

const WIN_RATE_UNAVAILABLE_QUEUE_TYPES = new Set(['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'])
const WIN_RATE_AVAILABLE_TIERS = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

export const RANKED_MASKED_PLACEHOLDER = '—'

export function isRankedWinRateUnavailableBelowMaster(
  _region: string | null | undefined,
  entry: Pick<RankedEntry, 'queueType' | 'tier'> | Partial<RankedEntry> | null | undefined
) {
  if (!entry?.queueType || !WIN_RATE_UNAVAILABLE_QUEUE_TYPES.has(entry.queueType)) {
    return false
  }

  const tier = (entry.tier || '').toUpperCase()
  if (!tier || tier === 'NA') {
    return false
  }

  return !WIN_RATE_AVAILABLE_TIERS.has(tier)
}
