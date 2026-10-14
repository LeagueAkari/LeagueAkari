import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TEAM_SCORE_SCALE,
  type DraftEvaluationContext,
  type DraftPerformanceSample,
  type DraftScoringOptions,
  type DraftSynergyTables,
  NEUTRAL_WIN_RATE,
  buildDraftCandidates,
  combineScore,
  evaluateChampion,
  findOpponentWinRate,
  findSynergySample,
  resolveTeamScores,
  sampleConfidence,
  shrinkWinRate,
  sortDraftCandidates,
  summarizeTeam
} from './scoring'

const OPTIONS: DraftScoringOptions = { riskLevel: 'medium', includeBaseWinRate: true }

function sample(winRate: number | null, games: number | null): DraftPerformanceSample {
  return { winRate, games }
}

/**
 * 按数据源的取向构造对位表集：`[被查询英雄, 对手, 被查询英雄自己的胜率]`。
 * 想表达"X 对阵 Y 时 X 的胜率是 55", 就写成 `[X, Y, 55]`。
 */
function matchupMap(entries: Array<[queried: number, opponent: number, queriedWinRate: number]>) {
  const tables = new Map<number, Map<number, DraftPerformanceSample>>()

  for (const [queried, opponent, queriedWinRate] of entries) {
    const table = tables.get(queried) ?? new Map<number, DraftPerformanceSample>()
    table.set(opponent, sample(queriedWinRate, null))
    tables.set(queried, table)
  }

  return tables
}

function synergyMap(
  entries: Array<[queried: number, partner: number, winRate: number, games: number | null]>
): DraftSynergyTables {
  const tables = new Map<number, Map<number, DraftPerformanceSample>>()

  for (const [queried, partner, winRate, games] of entries) {
    const table = tables.get(queried) ?? new Map<number, DraftPerformanceSample>()
    table.set(partner, sample(winRate, games))
    tables.set(queried, table)
  }

  return tables
}

const EMPTY_CONTEXT: DraftEvaluationContext = { matchups: new Map(), synergies: new Map() }

function rolesMap(entries: Array<[number, ChampionDataPosition | null]>) {
  return new Map<number, ChampionDataPosition | null>(entries)
}

function baseWinRatesMap(entries: Array<[number, number | null]>) {
  return new Map<number, number | null>(entries)
}

describe('draft advisor sample confidence', () => {
  it('treats missing or empty samples as no confidence', () => {
    expect(sampleConfidence(null, 'medium')).toBe(0)
    expect(sampleConfidence(0, 'medium')).toBe(0)
    expect(sampleConfidence(-10, 'medium')).toBe(0)
    expect(sampleConfidence(Number.NaN, 'medium')).toBe(0)
  })

  it('grows with sample size and never reaches certainty', () => {
    const small = sampleConfidence(10, 'medium')
    const large = sampleConfidence(10_000, 'medium')

    expect(small).toBeGreaterThan(0)
    expect(small).toBeLessThan(large)
    expect(large).toBeLessThan(1)
  })

  it('trusts small samples more as the risk level rises', () => {
    expect(sampleConfidence(500, 'low')).toBeLessThan(sampleConfidence(500, 'medium'))
    expect(sampleConfidence(500, 'medium')).toBeLessThan(sampleConfidence(500, 'high'))
  })

  it('shrinks a thin sample almost all the way back to neutral', () => {
    // 打野位真实存在"1 场 100% 胜率"这类记录, 它必须被压到接近中性。
    const shrunk = shrinkWinRate(sample(100, 1), 'medium')

    expect(shrunk).not.toBeNull()
    expect(shrunk!).toBeGreaterThan(NEUTRAL_WIN_RATE)
    expect(shrunk!).toBeLessThan(NEUTRAL_WIN_RATE + 1)
  })

  it('treats an unusable sample as missing rather than as a zero win rate', () => {
    expect(shrinkWinRate(sample(null, 5000), 'medium')).toBeNull()
    expect(shrinkWinRate(sample(Number.NaN, 5000), 'medium')).toBeNull()
    expect(shrinkWinRate(sample(55, null), 'medium')).toBeNull()
  })
})

describe('draft advisor matchup lookup', () => {
  it('reads the stored win rate directly and complements it in the other direction', () => {
    // 表以 100 为基准, 记录的是 100 自己对阵 200 时的胜率。
    const tables = matchupMap([[100, 200, 55]])

    expect(findOpponentWinRate(tables, 100, 200)).toBe(55)
    // 反向读同一个事实：200 的胜率是 100 的补数。
    expect(findOpponentWinRate(tables, 200, 100)).toBe(45)
  })

  it('falls back to the complement when only the other orientation is available', () => {
    // 表以 200 为基准, 记录的是 200 自己的胜率 40 => 100 自己的胜率是 60。
    const tables = matchupMap([[200, 100, 40]])

    expect(findOpponentWinRate(tables, 100, 200)).toBe(60)
    expect(findOpponentWinRate(tables, 200, 100)).toBe(40)
  })

  it('reports no data instead of inventing one', () => {
    expect(findOpponentWinRate(new Map(), 100, 200)).toBeNull()
    expect(findOpponentWinRate(matchupMap([[100, 300, 50]]), 100, 200)).toBeNull()
  })

  it('reads synergy from either side of the pairing', () => {
    const synergies = synergyMap([[10, 20, 56, 800]])

    expect(findSynergySample(synergies, 10, 20)?.winRate).toBe(56)
    expect(findSynergySample(synergies, 20, 10)?.winRate).toBe(56)
    expect(findSynergySample(synergies, 10, 99)).toBeNull()
  })
})

describe('draft advisor scoring', () => {
  it('renormalises weights over the signals that are present', () => {
    // 只有基础胜率可用时, 它应当独占权重, 而不是被缺席项稀释成 40%。
    const onlyBase = combineScore({
      baseWinRate: 60,
      matchupDelta: null,
      synergyDelta: null,
      matchupSamples: 0,
      synergySamples: 0
    })

    expect(onlyBase).toBe(60)
  })

  it('keeps matchup data in play even though its sample size is unknown', () => {
    // 回归用例：曾经把对位样本量当成 null, 结果所有对位信号都被判为不可用。
    const context: DraftEvaluationContext = {
      matchups: matchupMap([[200, 100, 45]]),
      synergies: new Map()
    }

    const { breakdown } = evaluateChampion(100, 50, [200], [], context, OPTIONS)

    expect(breakdown.matchupSamples).toBe(1)
    expect(breakdown.matchupDelta).not.toBeNull()
  })

  it('scores both sides of the same pairing as complementary', () => {
    // 表以 100 为基准, 记录的是 100 自己的胜率 55 => 100 占优, 200 处在劣势。
    const context: DraftEvaluationContext = {
      matchups: matchupMap([[100, 200, 55]]),
      synergies: new Map()
    }

    const ours = evaluateChampion(100, 50, [200], [], context, OPTIONS)
    const theirs = evaluateChampion(200, 50, [100], [], context, OPTIONS)

    // 100 对 200 有优势, 那么 200 对 100 就该是劣势, 且两者对称于中性值。
    expect(ours.winRate).toBeGreaterThan(NEUTRAL_WIN_RATE)
    expect(theirs.winRate).toBeLessThan(NEUTRAL_WIN_RATE)
    expect(ours.winRate - NEUTRAL_WIN_RATE).toBeCloseTo(NEUTRAL_WIN_RATE - theirs.winRate, 6)
  })
})

describe('draft advisor team summary', () => {
  it('skips members with no usable signal instead of counting them as neutral', () => {
    const summary = summarizeTeam(
      [1, 2],
      [],
      baseWinRatesMap([
        [1, 60],
        [2, null]
      ]),
      rolesMap([
        [1, 'middle'],
        [2, 'middle']
      ]),
      EMPTY_CONTEXT,
      OPTIONS
    )

    expect(summary.countedMembers).toBe(1)
    expect(summary.surplus).toBeCloseTo(10, 6)
    expect(summary.members).toHaveLength(2)
    expect(summary.members.find((member) => member.championId === 2)?.winRate).toBeNull()
  })

  it('adds up each member advantage over neutral', () => {
    const summary = summarizeTeam(
      [1, 2, 3],
      [],
      baseWinRatesMap([
        [1, 55],
        [2, 45],
        [3, 50]
      ]),
      rolesMap([]),
      EMPTY_CONTEXT,
      OPTIONS
    )

    expect(summary.countedMembers).toBe(3)
    expect(summary.surplus).toBeCloseTo(0, 6)
  })
})

describe('draft advisor team score', () => {
  it('keeps both sides complementary and inside the probability range', () => {
    const cases: Array<[ally: number, opponent: number]> = [
      [0, 0],
      [3, 3],
      [15, 0],
      [0, 15],
      [-15, 0],
      [100, 0],
      [0, 100],
      [1000, -1000],
      [-1000, 1000]
    ]

    for (const [ally, opponent] of cases) {
      const scores = resolveTeamScores(ally, opponent)

      expect(Number.isFinite(scores.ally), `ally surplus ${ally} vs ${opponent}`).toBe(true)
      expect(scores.ally + scores.opponent).toBeCloseTo(100, 9)
      expect(scores.ally).toBeGreaterThanOrEqual(0)
      expect(scores.ally).toBeLessThanOrEqual(100)
    }
  })

  it('reads an even draft as a coin flip', () => {
    const scores = resolveTeamScores(0, 0)

    expect(scores.ally).toBeCloseTo(50, 9)
    expect(scores.opponent).toBeCloseTo(50, 9)
  })

  it('grows monotonically with the advantage difference', () => {
    const weaker = resolveTeamScores(5, 0).ally
    const stronger = resolveTeamScores(10, 0).ally

    expect(stronger).toBeGreaterThan(weaker)
    expect(weaker).toBeGreaterThan(50)
  })

  it('saturates rather than running away at extreme advantages', () => {
    const scores = resolveTeamScores(100, 0)

    expect(scores.ally).toBeGreaterThan(99)
    expect(scores.ally).toBeLessThanOrEqual(100)
  })

  it('separates the sides more sharply as the scale shrinks', () => {
    const gentle = resolveTeamScores(10, 0, DEFAULT_TEAM_SCORE_SCALE).ally
    const sharp = resolveTeamScores(10, 0, DEFAULT_TEAM_SCORE_SCALE / 2).ally

    expect(sharp).toBeGreaterThan(gentle)
  })
})

describe('draft advisor candidate list', () => {
  const allyChampionIds = [11, 12]
  const opponentChampionIds = [21, 22]

  function build(
    side: 'ally' | 'opponent',
    pool: number[],
    surpluses: [ally: number, opponent: number] = [0, 0]
  ) {
    return buildDraftCandidates({
      pool,
      side,
      allyChampionIds,
      opponentChampionIds,
      baseWinRates: baseWinRatesMap([
        [11, 50],
        [12, 50],
        [21, 50],
        [22, 50],
        [31, 58],
        [32, 42]
      ]),
      roles: rolesMap([
        [31, 'middle'],
        [32, 'middle']
      ]),
      context: EMPTY_CONTEXT,
      options: OPTIONS,
      sideSurplus: side === 'ally' ? surpluses[0] : surpluses[1],
      opposingSurplus: side === 'ally' ? surpluses[1] : surpluses[0]
    })
  }

  it('ranks candidates and keeps the ranking consistent with their own strength', () => {
    const ranked = sortDraftCandidates(build('ally', [31, 32]))

    expect(ranked.map((candidate) => candidate.championId)).toEqual([31, 32])
    expect(ranked[0].teamScore).toBeGreaterThan(ranked[1].teamScore)
  })

  it('reports the score the picking side would reach, not the champion own win rate', () => {
    const [best] = sortDraftCandidates(build('ally', [31, 32]))

    expect(best.winRate).toBeCloseTo(58, 6)
    expect(best.teamScore).toBeGreaterThan(best.winRate)
    expect(best.teamScore).toBeLessThan(100)
  })

  it('values a champion identically for either side when the draft is even', () => {
    const ours = build('ally', [31])[0]
    const theirs = build('opponent', [31])[0]

    // 同一个英雄给哪一边带来的处境胜率是同一个数。
    expect(ours.winRate).toBeCloseTo(theirs.winRate, 6)
    // 阵容分读的是"这一方选下他之后的阵容分"。对等局势下, 谁选下他谁就拿到同一个数,
    // 而不是一边比另一边多 —— 两侧的阵容分互补说的是同一个局势的两面, 不是两个候选。
    expect(ours.teamScore).toBeCloseTo(theirs.teamScore, 6)
    expect(ours.teamScore).toBeGreaterThan(NEUTRAL_WIN_RATE)
  })

  it('shrinks a champion marginal gain once that side is already ahead', () => {
    const fromEven = build('ally', [31], [0, 0])[0].teamScore - 50
    const fromAhead =
      build('ally', [31], [40, 0])[0].teamScore -
      100 / (1 + Math.exp(-40 / DEFAULT_TEAM_SCORE_SCALE))

    expect(fromEven).toBeGreaterThan(0)
    expect(fromAhead).toBeLessThan(fromEven)
  })

  it('carries the role through to the candidate', () => {
    const [candidate] = build('ally', [31])

    expect(candidate.role).toBe('middle')
  })

  it('returns an empty list for an empty pool', () => {
    expect(build('ally', [])).toEqual([])
  })
})
