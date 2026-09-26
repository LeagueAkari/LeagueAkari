import type {
  DraftAdvisorCandidate,
  DraftAdvisorRiskLevel,
  DraftAdvisorScoreBreakdown
} from '@shared/types/draft-advisor'

/**
 * 对位与协同数据都以中性胜率为锚点表达为差值, 因此评分的量纲与胜率一致,
 * 面板可以直接把 `score` 当作"这套阵容下该英雄的预期胜率"来呈现。
 */
export const NEUTRAL_WIN_RATE = 50

export interface DraftPerformanceSample {
  winRate: number | null
  games: number | null
}

export interface DraftCandidateInput {
  championId: number
  baseWinRate: number | null
  games: number | null
}

export interface DraftEnemyInput {
  championId: number

  /** key 为候选英雄 id, value 为该候选对阵此敌方英雄的表现 */
  matchups: ReadonlyMap<number, DraftPerformanceSample>
}

export interface DraftAllyInput {
  championId: number

  /** key 为候选英雄 id, value 为该候选与此队友同队时的表现 */
  synergies: ReadonlyMap<number, DraftPerformanceSample>
}

export interface DraftScoringOptions {
  riskLevel: DraftAdvisorRiskLevel
  includeBaseWinRate: boolean
}

export type DraftScoringWeights = Readonly<{
  base: number
  matchup: number
  synergy: number
}>

/**
 * 样本量收缩常数。数据量远小于该值时, 观测胜率会被强力拉回中性胜率,
 * 避免几十场的"神仙对位"把推荐带偏。
 */
const RISK_SMOOTHING: Readonly<Record<DraftAdvisorRiskLevel, number>> = {
  low: 5000,
  medium: 1500,
  high: 300
}

export const DEFAULT_DRAFT_SCORING_WEIGHTS: DraftScoringWeights = {
  base: 0.4,
  matchup: 0.35,
  synergy: 0.25
}

export function sampleConfidence(games: number | null, riskLevel: DraftAdvisorRiskLevel) {
  if (games === null || !Number.isFinite(games) || games <= 0) {
    return 0
  }

  const smoothing = RISK_SMOOTHING[riskLevel]
  return games / (games + smoothing)
}

/**
 * 把观测胜率按样本量向中性胜率收缩。样本不足或缺少胜率时返回 null,
 * 由调用方将其视为"该信号缺失"而不是"胜率为 0"。
 */
export function shrinkWinRate(
  sample: DraftPerformanceSample,
  riskLevel: DraftAdvisorRiskLevel
): number | null {
  if (sample.winRate === null || !Number.isFinite(sample.winRate)) {
    return null
  }

  const confidence = sampleConfidence(sample.games, riskLevel)
  if (confidence <= 0) {
    return null
  }

  return NEUTRAL_WIN_RATE + (sample.winRate - NEUTRAL_WIN_RATE) * confidence
}

function buildBreakdown(
  candidate: DraftCandidateInput,
  enemies: readonly DraftEnemyInput[],
  allies: readonly DraftAllyInput[],
  options: DraftScoringOptions
): DraftAdvisorScoreBreakdown {
  const baseWinRate =
    options.includeBaseWinRate &&
    candidate.baseWinRate !== null &&
    Number.isFinite(candidate.baseWinRate)
      ? candidate.baseWinRate
      : null

  let matchupTotal = 0
  let matchupSamples = 0

  for (const enemy of enemies) {
    const sample = enemy.matchups.get(candidate.championId)
    if (!sample) {
      continue
    }

    const value = shrinkWinRate(sample, options.riskLevel)
    if (value === null) {
      continue
    }

    matchupTotal += value - NEUTRAL_WIN_RATE
    matchupSamples += 1
  }

  let synergyTotal = 0
  let synergySamples = 0

  for (const ally of allies) {
    const sample = ally.synergies.get(candidate.championId)
    if (!sample) {
      continue
    }

    const value = shrinkWinRate(sample, options.riskLevel)
    if (value === null) {
      continue
    }

    synergyTotal += value - NEUTRAL_WIN_RATE
    synergySamples += 1
  }

  return {
    baseWinRate,
    matchupDelta: matchupSamples > 0 ? matchupTotal / matchupSamples : null,
    synergyDelta: synergySamples > 0 ? synergyTotal / synergySamples : null,
    matchupSamples,
    synergySamples
  }
}

/**
 * 只在真正拿到了信号的项之间分配权重。首个选人之后敌方为空、或己方尚无队友时,
 * 剩余信号会自动获得全部权重, 而不是被缺席项稀释。
 */
export function combineScore(
  breakdown: DraftAdvisorScoreBreakdown,
  weights: DraftScoringWeights = DEFAULT_DRAFT_SCORING_WEIGHTS
): number {
  const contributions: Array<{ weight: number; delta: number }> = []

  if (breakdown.baseWinRate !== null) {
    contributions.push({ weight: weights.base, delta: breakdown.baseWinRate - NEUTRAL_WIN_RATE })
  }

  if (breakdown.matchupDelta !== null && breakdown.matchupSamples > 0) {
    contributions.push({ weight: weights.matchup, delta: breakdown.matchupDelta })
  }

  if (breakdown.synergyDelta !== null && breakdown.synergySamples > 0) {
    contributions.push({ weight: weights.synergy, delta: breakdown.synergyDelta })
  }

  const totalWeight = contributions.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) {
    return NEUTRAL_WIN_RATE
  }

  const weightedDelta = contributions.reduce((sum, item) => sum + item.weight * item.delta, 0)
  return NEUTRAL_WIN_RATE + weightedDelta / totalWeight
}

export function scoreDraftCandidates(
  candidates: readonly DraftCandidateInput[],
  enemies: readonly DraftEnemyInput[],
  allies: readonly DraftAllyInput[],
  options: DraftScoringOptions,
  weights: DraftScoringWeights = DEFAULT_DRAFT_SCORING_WEIGHTS
): DraftAdvisorCandidate[] {
  return candidates.map((candidate) => {
    const breakdown = buildBreakdown(candidate, enemies, allies, options)

    return {
      championId: candidate.championId,
      score: combineScore(breakdown, weights),
      breakdown
    }
  })
}

export function sortDraftCandidatesByScore(candidates: readonly DraftAdvisorCandidate[]) {
  return [...candidates].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    // 同分时优先展示信号更完整的候选, 让用户更容易判断推荐依据是否充分。
    const leftCoverage = left.breakdown.matchupSamples + left.breakdown.synergySamples
    const rightCoverage = right.breakdown.matchupSamples + right.breakdown.synergySamples
    if (rightCoverage !== leftCoverage) {
      return rightCoverage - leftCoverage
    }

    return left.championId - right.championId
  })
}
