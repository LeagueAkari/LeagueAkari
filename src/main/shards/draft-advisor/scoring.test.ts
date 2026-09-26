import { describe, expect, it } from 'vitest'

import {
  type DraftAllyInput,
  type DraftCandidateInput,
  type DraftEnemyInput,
  type DraftPerformanceSample,
  NEUTRAL_WIN_RATE,
  combineScore,
  sampleConfidence,
  scoreDraftCandidates,
  shrinkWinRate,
  sortDraftCandidatesByScore
} from './scoring'

function sample(winRate: number | null, games: number | null): DraftPerformanceSample {
  return { winRate, games }
}

function unwrap(value: number | null): number {
  expect(value).not.toBeNull()
  return value as number
}

function candidate(championId: number, baseWinRate: number | null = null): DraftCandidateInput {
  return { championId, baseWinRate, games: 10000 }
}

function enemyWith(
  championId: number,
  matchups: Array<[number, DraftPerformanceSample]>
): DraftEnemyInput {
  return { championId, matchups: new Map(matchups) }
}

function allyWith(
  championId: number,
  synergies: Array<[number, DraftPerformanceSample]>
): DraftAllyInput {
  return { championId, synergies: new Map(synergies) }
}

describe('draft advisor sample confidence', () => {
  it('treats missing or empty samples as no confidence', () => {
    expect(sampleConfidence(null, 'medium')).toBe(0)
    expect(sampleConfidence(0, 'medium')).toBe(0)
    expect(sampleConfidence(-5, 'medium')).toBe(0)
    expect(sampleConfidence(Number.NaN, 'medium')).toBe(0)
  })

  it('grows with sample size and never reaches certainty', () => {
    const small = sampleConfidence(100, 'medium')
    const large = sampleConfidence(100000, 'medium')

    expect(small).toBeGreaterThan(0)
    expect(small).toBeLessThan(large)
    expect(large).toBeLessThan(1)
  })

  it('lets higher risk levels trust smaller samples', () => {
    expect(sampleConfidence(500, 'high')).toBeGreaterThan(sampleConfidence(500, 'medium'))
    expect(sampleConfidence(500, 'medium')).toBeGreaterThan(sampleConfidence(500, 'low'))
  })
})

describe('draft advisor win rate shrinking', () => {
  it('returns null when the win rate is unusable instead of pretending it is zero', () => {
    expect(shrinkWinRate(sample(null, 1000), 'medium')).toBeNull()
    expect(shrinkWinRate(sample(55, 0), 'medium')).toBeNull()
    expect(shrinkWinRate(sample(Number.NaN, 1000), 'medium')).toBeNull()
  })

  it('pulls a high win rate down the less data backs it', () => {
    const tiny = unwrap(shrinkWinRate(sample(70, 50), 'medium'))
    const huge = unwrap(shrinkWinRate(sample(70, 500000), 'medium'))

    expect(tiny).toBeLessThan(huge)
    expect(huge).toBeLessThan(70)
    expect(huge).toBeGreaterThan(NEUTRAL_WIN_RATE)
  })

  it('keeps the neutral win rate fixed regardless of sample size', () => {
    expect(unwrap(shrinkWinRate(sample(NEUTRAL_WIN_RATE, 10), 'medium'))).toBeCloseTo(
      NEUTRAL_WIN_RATE
    )
    expect(unwrap(shrinkWinRate(sample(NEUTRAL_WIN_RATE, 100000), 'medium'))).toBeCloseTo(
      NEUTRAL_WIN_RATE
    )
  })
})

describe('draft advisor score combination', () => {
  it('falls back to the neutral score when every signal is missing', () => {
    expect(
      combineScore({
        baseWinRate: null,
        matchupDelta: null,
        synergyDelta: null,
        matchupSamples: 0,
        synergySamples: 0
      })
    ).toBe(NEUTRAL_WIN_RATE)
  })

  it('does not dilute the remaining signals when some are absent', () => {
    const onlyBase = combineScore({
      baseWinRate: 55,
      matchupDelta: null,
      synergyDelta: null,
      matchupSamples: 0,
      synergySamples: 0
    })

    expect(onlyBase).toBeCloseTo(55)
  })

  it('moves the score in the direction of every available signal', () => {
    const favourable = combineScore({
      baseWinRate: 52,
      matchupDelta: 4,
      synergyDelta: 3,
      matchupSamples: 3,
      synergySamples: 2
    })

    const unfavourable = combineScore({
      baseWinRate: 48,
      matchupDelta: -4,
      synergyDelta: -3,
      matchupSamples: 3,
      synergySamples: 2
    })

    expect(favourable).toBeGreaterThan(NEUTRAL_WIN_RATE)
    expect(unfavourable).toBeLessThan(NEUTRAL_WIN_RATE)
  })
})

describe('draft advisor candidate scoring', () => {
  it('ranks the champion that counters the enemy team above one that does not', () => {
    const candidates = [candidate(1), candidate(2)]
    const enemies = [
      enemyWith(101, [
        [1, sample(58, 100000)],
        [2, sample(45, 100000)]
      ])
    ]

    const scored = sortDraftCandidatesByScore(
      scoreDraftCandidates(candidates, enemies, [], {
        riskLevel: 'medium',
        includeBaseWinRate: true
      })
    )

    expect(scored.map((item) => item.championId)).toEqual([1, 2])
    expect(scored[0].breakdown.matchupSamples).toBe(1)
  })

  it('ranks the champion with better ally synergy above one that lacks it', () => {
    const candidates = [candidate(1), candidate(2)]
    const allies = [
      allyWith(201, [
        [1, sample(60, 100000)],
        [2, sample(48, 100000)]
      ])
    ]

    const scored = sortDraftCandidatesByScore(
      scoreDraftCandidates(candidates, [], allies, {
        riskLevel: 'medium',
        includeBaseWinRate: true
      })
    )

    expect(scored.map((item) => item.championId)).toEqual([1, 2])
    expect(scored[0].breakdown.synergySamples).toBe(1)
  })

  it('ignores enemies and allies that carry no data for the candidate', () => {
    const candidates = [candidate(1)]
    const enemies = [
      enemyWith(101, [[1, sample(60, 100000)]]),
      enemyWith(102, [[999, sample(1, 100000)]])
    ]

    const [scored] = scoreDraftCandidates(candidates, enemies, [], {
      riskLevel: 'medium',
      includeBaseWinRate: true
    })

    expect(scored.breakdown.matchupSamples).toBe(1)
    expect(scored.breakdown.matchupDelta).toBeGreaterThan(0)
  })

  it('reports a null delta and no samples when the draft has no opponents yet', () => {
    const [scored] = scoreDraftCandidates([candidate(1, 53)], [], [], {
      riskLevel: 'medium',
      includeBaseWinRate: true
    })

    expect(scored.breakdown.matchupDelta).toBeNull()
    expect(scored.breakdown.matchupSamples).toBe(0)
    expect(scored.score).toBeCloseTo(53)
  })

  it('drops the base win rate entirely when the option is disabled', () => {
    const [withBase] = scoreDraftCandidates([candidate(1, 53)], [], [], {
      riskLevel: 'medium',
      includeBaseWinRate: true
    })
    const [withoutBase] = scoreDraftCandidates([candidate(1, 53)], [], [], {
      riskLevel: 'medium',
      includeBaseWinRate: false
    })

    expect(withBase.score).toBeCloseTo(53)
    expect(withoutBase.breakdown.baseWinRate).toBeNull()
    expect(withoutBase.score).toBe(NEUTRAL_WIN_RATE)
  })

  it('prefers the better-covered candidate when scores tie', () => {
    const candidates = [candidate(1), candidate(2)]
    const enemies = [
      enemyWith(101, [
        [1, sample(55, 100000)],
        [2, sample(55, 100000)]
      ]),
      enemyWith(102, [[1, sample(55, 100000)]])
    ]

    const scored = sortDraftCandidatesByScore(
      scoreDraftCandidates(candidates, enemies, [], {
        riskLevel: 'medium',
        includeBaseWinRate: true
      })
    )

    expect(scored[0].championId).toBe(1)
    expect(scored[0].breakdown.matchupSamples).toBe(2)
  })

  it('returns an empty list for an empty candidate set', () => {
    expect(
      scoreDraftCandidates([], [], [], { riskLevel: 'medium', includeBaseWinRate: true })
    ).toEqual([])
  })
})
