import { RankedEntry } from '@shared/types/league-client/ranked'

const TENCENT_WIN_RATE_UNAVAILABLE_QUEUE_TYPES = new Set(['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'])
const TENCENT_WIN_RATE_AVAILABLE_TIERS = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

export const RANKED_MASKED_PLACEHOLDER = '-'

export function isTencentWinRateUnavailableBelowMaster(
  region: string | null | undefined,
  entry: Pick<RankedEntry, 'queueType' | 'tier'> | Partial<RankedEntry> | null | undefined
) {
  if ((region || '').toUpperCase() !== 'TENCENT') {
    return false
  }

  if (!entry?.queueType || !TENCENT_WIN_RATE_UNAVAILABLE_QUEUE_TYPES.has(entry.queueType)) {
    return false
  }

  const tier = (entry.tier || '').toUpperCase()
  if (!tier || tier === 'NA') {
    return false
  }

  return !TENCENT_WIN_RATE_AVAILABLE_TIERS.has(tier)
}
