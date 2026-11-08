import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import type {
  DraftAdvisorCandidate,
  DraftAdvisorRiskLevel,
  DraftAdvisorScoreBreakdown,
  DraftAdvisorTeamMember,
  DraftAdvisorTeamScore,
  DraftAdvisorTeamSide
} from '@shared/types/draft-advisor'

/**
 * 对位与协同数据都以中性胜率为锚点表达为差值, 因此评分的量纲与胜率一致,
 * 面板可以直接把评分当作"这套阵容下该英雄的预期胜率"来呈现。
 */
export const NEUTRAL_WIN_RATE = 50

/** 胜率量纲的上界。对位是两方互斥的结果, 因此一方的胜率就是另一方的补数。 */
const FULL_WIN_RATE = 100

export interface DraftPerformanceSample {
  winRate: number | null
  games: number | null
}

/**
 * 对位表集。
 *
 * key 是"作为查询基准的英雄", value 是该英雄的各对手 —— 而 value 里存的是
 * **被查询英雄自己的胜率**（数据源给出的就是"该英雄对阵各对手时的胜率"）。
 * 取向很容易搞反, 因此统一由 `findOpponentWinRate` 读取, 不要在别处直接查表。
 */
export type DraftMatchupTables = ReadonlyMap<number, ReadonlyMap<number, DraftPerformanceSample>>

/**
 * 协同表集。key 是"作为查询基准的英雄", value 是其各搭档与它的同队胜率。
 * 协同是对称的, 所以从任何一侧读都是同一个值。
 */
export type DraftSynergyTables = ReadonlyMap<number, ReadonlyMap<number, DraftPerformanceSample>>

export interface DraftEvaluationContext {
  matchups: DraftMatchupTables
  synergies: DraftSynergyTables
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

/**
 * 对位数据源只给出胜率, 不给出样本量（协同数据源两者都有）。既然真实样本量不可知,
 * 就不能当成"样本充足"。这里用一个保守的等效样本量参与收缩, 让对位信号保持在中等
 * 可信度：既不被当作噪声丢弃, 也不会压过有真实样本量的协同信号。
 */
export const UNKNOWN_MATCHUP_SAMPLE_SIZE = 1200

export const DEFAULT_DRAFT_SCORING_WEIGHTS: DraftScoringWeights = {
  base: 0.4,
  matchup: 0.35,
  synergy: 0.25
}

/**
 * 阵容分对"净优势差"的敏感度, 单位是百分点。
 *
 * 双方阵容分是一条 logistic 曲线上的两个互补取值, 该常数决定曲线多陡：数值越小,
 * 同样的优势差会拉出越大的分差。15 大致让"净优势差 15 个百分点"读作约 73%,
 * 与常见 BP 工具的量级接近。它属于可调校准值, 集中放在这里便于日后调整。
 */
export const DEFAULT_TEAM_SCORE_SCALE = 15

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

function isUsableWinRate(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value)
}

/**
 * 读取"`self` 在对阵 `opponent` 时的胜率"。
 *
 * 数据源按"被查询英雄 + 分路"组织数据, 所以我们手上未必有以 `self` 为基准的表。
 * 两种取向都要认：
 * - 有以 `self` 为基准的表时, 直接取出表里记录的自己的胜率；
 * - 只有以 `opponent` 为基准的表时, 表里存的是对手的胜率, 取补数。
 *
 * 实测依据：某英雄全部对位记录的均值与它自己的分路胜率吻合（而不是与补数吻合）,
 * 因此表内数值属于被查询英雄本身。
 */
export function findOpponentWinRate(
  matchups: DraftMatchupTables,
  self: number,
  opponent: number
): number | null {
  const direct = matchups.get(self)?.get(opponent)?.winRate
  if (isUsableWinRate(direct)) {
    return direct
  }

  const inverse = matchups.get(opponent)?.get(self)?.winRate
  if (isUsableWinRate(inverse)) {
    return FULL_WIN_RATE - inverse
  }

  return null
}

/** 读取"`self` 与 `partner` 同队时的表现"。协同对称, 任一侧的表都可以。 */
export function findSynergySample(
  synergies: DraftSynergyTables,
  self: number,
  partner: number
): DraftPerformanceSample | null {
  return synergies.get(partner)?.get(self) ?? synergies.get(self)?.get(partner) ?? null
}

function buildBreakdown(
  championId: number,
  baseWinRate: number | null,
  opponents: readonly number[],
  teammates: readonly number[],
  context: DraftEvaluationContext,
  options: DraftScoringOptions
): DraftAdvisorScoreBreakdown {
  const useBase = options.includeBaseWinRate && isUsableWinRate(baseWinRate)

  let matchupTotal = 0
  let matchupSamples = 0

  for (const opponentChampionId of opponents) {
    const winRate = findOpponentWinRate(context.matchups, championId, opponentChampionId)
    if (winRate === null) {
      continue
    }

    const value = shrinkWinRate({ winRate, games: UNKNOWN_MATCHUP_SAMPLE_SIZE }, options.riskLevel)
    if (value === null) {
      continue
    }

    matchupTotal += value - NEUTRAL_WIN_RATE
    matchupSamples += 1
  }

  let synergyTotal = 0
  let synergySamples = 0

  for (const teammateChampionId of teammates) {
    const sample = findSynergySample(context.synergies, championId, teammateChampionId)
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
    baseWinRate: useBase ? baseWinRate : null,
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

export interface DraftChampionEvaluation {
  winRate: number

  breakdown: DraftAdvisorScoreBreakdown
}

/**
 * 在给定语境下评估一个英雄的处境胜率。`opponents` / `teammates` 由调用方按
 * "这个英雄站在哪一边"决定, 因此同一函数既能评我方人选, 也能评对方人选。
 */
export function evaluateChampion(
  championId: number,
  baseWinRate: number | null,
  opponents: readonly number[],
  teammates: readonly number[],
  context: DraftEvaluationContext,
  options: DraftScoringOptions,
  weights: DraftScoringWeights = DEFAULT_DRAFT_SCORING_WEIGHTS
): DraftChampionEvaluation {
  const breakdown = buildBreakdown(championId, baseWinRate, opponents, teammates, context, options)

  return { winRate: combineScore(breakdown, weights), breakdown }
}

function hasContextSignal(
  championId: number,
  opponents: readonly number[],
  teammates: readonly number[],
  context: DraftEvaluationContext
) {
  return (
    opponents.some((id) => findOpponentWinRate(context.matchups, championId, id) !== null) ||
    teammates.some((id) => findSynergySample(context.synergies, championId, id) !== null)
  )
}

export interface DraftTeamSummary {
  members: DraftAdvisorTeamMember[]

  /** 全队处境胜率相对中性胜率的累计优势, 单位是百分点 */
  surplus: number

  /** 有处境胜率参与统计的成员数量 */
  countedMembers: number
}

/**
 * 汇总一方阵容。
 *
 * 一点信号都取不到的英雄会被跳过, 而不是按 50 计入 —— 后者会稀释整队的优势差,
 * 相当于把"数据缺口"伪装成"这个英雄很平庸"。
 */
export function summarizeTeam(
  teamChampionIds: readonly number[],
  opponentChampionIds: readonly number[],
  baseWinRates: ReadonlyMap<number, number | null>,
  roles: ReadonlyMap<number, ChampionDataPosition | null>,
  context: DraftEvaluationContext,
  options: DraftScoringOptions,
  weights: DraftScoringWeights = DEFAULT_DRAFT_SCORING_WEIGHTS
): DraftTeamSummary {
  const members: DraftAdvisorTeamMember[] = []
  let surplus = 0
  let countedMembers = 0

  for (const championId of teamChampionIds) {
    const position = roles.get(championId) ?? null
    const teammates = teamChampionIds.filter((teammateId) => teammateId !== championId)
    const baseWinRate = baseWinRates.get(championId) ?? null

    if (
      !isUsableWinRate(baseWinRate) &&
      !hasContextSignal(championId, opponentChampionIds, teammates, context)
    ) {
      members.push({ championId, position, winRate: null })
      continue
    }

    const { winRate } = evaluateChampion(
      championId,
      baseWinRate,
      opponentChampionIds,
      teammates,
      context,
      options,
      weights
    )

    members.push({ championId, position, winRate })
    surplus += winRate - NEUTRAL_WIN_RATE
    countedMembers += 1
  }

  return { members, surplus, countedMembers }
}

/**
 * 把双方的优势差折算成互补的阵容分。
 *
 * 用 logistic 而不是线性差值：线性公式在极端优势差下会冲出 0-100, 而阵容分要当作
 * 胜率来读, 必须始终落在概率区间内。双方取值恒为互补, 和恰好是 100。
 */
export function resolveTeamScores(
  allySurplus: number,
  opponentSurplus: number,
  scale: number = DEFAULT_TEAM_SCORE_SCALE
): DraftAdvisorTeamScore {
  const ally = FULL_WIN_RATE / (1 + Math.exp(-(allySurplus - opponentSurplus) / scale))

  return { ally, opponent: FULL_WIN_RATE - ally }
}

export interface DraftCandidatePoolInput {
  /** 待评估的英雄池 */
  pool: readonly number[]

  side: DraftAdvisorTeamSide

  allyChampionIds: readonly number[]
  opponentChampionIds: readonly number[]

  baseWinRates: ReadonlyMap<number, number | null>
  roles: ReadonlyMap<number, ChampionDataPosition | null>

  context: DraftEvaluationContext
  options: DraftScoringOptions

  weights?: DraftScoringWeights

  /** 该方当前已确定的累计优势, 用于把候选折算成"选下他之后的阵容分" */
  sideSurplus: number

  /** 对侧当前已确定的累计优势 */
  opposingSurplus: number

  teamScoreScale?: number
}

/**
 * 生成某一方的选人榜。
 *
 * 列表值不是英雄自身的胜率, 而是"这一方选下他之后的阵容分" —— 这样列表既能排序,
 * 也能直接和侧栏的阵容分对照读出增益。由于阵容分对候选自身优势是单调的, 排序结果
 * 与按处境胜率排序完全一致。
 */
export function buildDraftCandidates(input: DraftCandidatePoolInput): DraftAdvisorCandidate[] {
  const {
    pool,
    side,
    allyChampionIds,
    opponentChampionIds,
    baseWinRates,
    roles,
    context,
    options,
    weights = DEFAULT_DRAFT_SCORING_WEIGHTS,
    sideSurplus,
    opposingSurplus,
    teamScoreScale = DEFAULT_TEAM_SCORE_SCALE
  } = input

  const teammates = side === 'ally' ? allyChampionIds : opponentChampionIds
  const opponents = side === 'ally' ? opponentChampionIds : allyChampionIds

  return pool.map((championId) => {
    const { winRate, breakdown } = evaluateChampion(
      championId,
      baseWinRates.get(championId) ?? null,
      opponents,
      teammates,
      context,
      options,
      weights
    )

    const ownSurplus = sideSurplus + (winRate - NEUTRAL_WIN_RATE)

    // `resolveTeamScores` 的第一个参数恒为"己方(蓝方)"。评估对方候选时, 己方优势仍然
    // 是 `opposingSurplus`, 所以入参顺序要跟着翻转, 否则会把这一方的阵容分算成对侧的。
    const scores =
      side === 'ally'
        ? resolveTeamScores(ownSurplus, opposingSurplus, teamScoreScale)
        : resolveTeamScores(opposingSurplus, ownSurplus, teamScoreScale)

    return {
      championId,
      teamScore: side === 'ally' ? scores.ally : scores.opponent,
      winRate,
      role: roles.get(championId) ?? null,
      breakdown
    }
  })
}

export function sortDraftCandidates(candidates: readonly DraftAdvisorCandidate[]) {
  return [...candidates].sort((left, right) => {
    if (right.teamScore !== left.teamScore) {
      return right.teamScore - left.teamScore
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
