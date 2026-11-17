import type { HextechAugmentLabel, HextechAugmentSnapshot } from '@shared/types/hextech-augment'
import { describe, expect, it } from 'vitest'

import { getChangedAugmentIds, getRankBars, getTopAugmentIds } from './offer-display'

function label(id: number, tier: string | null, tierRank: number | null): HextechAugmentLabel {
  return { id, tier, tierRank, name: String(id), x: 0, y: 0, width: 10, height: 10 }
}

describe('top offered augments', () => {
  it('marks the best within-tier rank when all three have the same grade', () => {
    expect([...getTopAugmentIds([label(1, 'A', 12), label(2, 'A', 3), label(3, 'A', 8)])]).toEqual([
      2
    ])
  })
  it('compares grades before within-tier ranks', () => {
    expect([...getTopAugmentIds([label(1, 'B', 1), label(2, 'S', 20), label(3, 'A', 1)])]).toEqual([
      2
    ])
  })
  it('marks every tied best offer', () => {
    expect([...getTopAugmentIds([label(1, 'A', 3), label(2, 'A', 8), label(3, 'A', 3)])]).toEqual([
      1, 3
    ])
  })
  it('keeps an unresolved same-tier comparison unmarked', () => {
    expect([
      ...getTopAugmentIds([label(1, 'A', 3), label(2, 'A', null), label(3, 'B', 1)])
    ]).toEqual([])
  })
  it('marks a single highest grade without a within-tier rank', () => {
    expect([
      ...getTopAugmentIds([label(1, 'A', null), label(2, 'B', 1), label(3, 'B', 2)])
    ]).toEqual([1])
  })
  it('leaves missing ratings and empty selections unmarked', () => {
    expect([...getTopAugmentIds([label(1, null, null), label(2, null, null)])]).toEqual([])
    expect([...getTopAugmentIds([])]).toEqual([])
  })
  it('shows the within-tier rank third and leaves unavailable ranks empty', () => {
    expect(
      [1, 10, 11, 20, 21, 30].map((rank) => getRankBars({ ...label(1, 'A', rank), tierCount: 30 }))
    ).toEqual([3, 3, 2, 2, 1, 1])
    expect(getRankBars(label(1, 'A', null))).toBe(0)
  })
})

function selection(ids: number[], championId = 11): HextechAugmentSnapshot {
  return {
    championId,
    capturedAt: Date.now(),
    expiresAt: Date.now() + 4000,
    window: { id: 'game', x: 0, y: 0, width: 1920, height: 1080 },
    labels: ids.map((id) => label(id, 'A', 1))
  }
}

describe('changed offered augments', () => {
  it('detects a changed option even when its grade and rank are equal', () => {
    expect(getChangedAugmentIds(selection([1, 2, 3]), selection([1, 4, 3]))).toEqual([4])
  })
  it('detects multiple changed options', () => {
    expect(getChangedAugmentIds(selection([1, 2, 3]), selection([4, 2, 5]))).toEqual([4, 5])
  })
  it('keeps repeated recognition of the same selection quiet', () => {
    expect(getChangedAugmentIds(selection([1, 2, 3]), selection([1, 2, 3]))).toEqual([])
  })
  it('treats an initial, cleared or different champion selection as a new context', () => {
    expect(getChangedAugmentIds(null, selection([1, 2, 3]))).toEqual([])
    expect(getChangedAugmentIds(selection([1, 2, 3]), null)).toEqual([])
    expect(getChangedAugmentIds(selection([1, 2, 3]), selection([4, 5, 6], 22))).toEqual([])
  })
})
