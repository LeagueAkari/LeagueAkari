import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'

/**
 * 对低样本数据的信任程度。等级越高, 越愿意采信样本量小的对位与协同数据。
 *
 * 该值直接决定打分阶段的样本量收缩强度, 见 `sampleConfidence`。
 */
export type DraftAdvisorRiskLevel = 'low' | 'medium' | 'high'

/** 候选展示数量的取值范围, 主进程的设置校验与渲染层的输入框共用同一份边界。 */
export const MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT = 3
export const MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT = 40

/** 竞选名单所属的一方。 */
export type DraftAdvisorTeamSide = 'ally' | 'opponent'

export interface DraftAdvisorSettings {
  enabled: boolean

  /** 进入精算阶段的候选英雄上限, 用于约束选人阶段的请求量 */
  candidateLimit: number

  /** 是否把英雄自身的基础胜率计入评分 */
  includeBaseWinRate: boolean

  riskLevel: DraftAdvisorRiskLevel
}

export interface DraftAdvisorScoreBreakdown {
  /** 英雄在当前位置的基础胜率, 未启用基础项时为 null */
  baseWinRate: number | null

  /** 候选英雄面对敌方阵容的平均对位胜率差值, 相对中性胜率, 无数据时为 null */
  matchupDelta: number | null

  /** 候选英雄与己方阵容的平均协同胜率差值, 相对中性胜率, 无数据时为 null */
  synergyDelta: number | null

  /** 实际参与对位统计的敌方英雄数量 */
  matchupSamples: number

  /** 实际参与协同统计的己方英雄数量 */
  synergySamples: number
}

/**
 * 阵容中的一名英雄。
 *
 * `winRate` 是该英雄在这套具体对局里的处境胜率 (基础胜率 + 对位 + 协同),
 * 而不是它的全局胜率 —— 同一英雄换个对手就会不同。
 */
export interface DraftAdvisorTeamMember {
  championId: number

  /** 该英雄在本局中的分路, 取自客户端分配结果, 无法判定时为 null */
  position: ChampionDataPosition | null

  /** 处境胜率; 数据不足时为 null */
  winRate: number | null
}

/**
 * 双方的阵容强度分。两者互补且恒为 100, 因此可以直接读作「这套阵容的胜率」。
 *
 * 50 / 50 表示双方阵容强度相当。
 */
export interface DraftAdvisorTeamScore {
  ally: number
  opponent: number
}

export interface DraftAdvisorCandidate {
  championId: number

  /**
   * 该候选被这一方选下之后, 这一方的阵容分。
   *
   * 与 `DraftAdvisorTeamScore` 同量纲, 所以列表既能排序, 也能直接读出
   * 「选下他之后我们（或对方）的胜率会变成多少」。
   */
  teamScore: number

  /** 该英雄在这套对局里的处境胜率, 用于解释分数来源 */
  winRate: number

  /** 该英雄的分路 */
  role: ChampionDataPosition | null

  breakdown: DraftAdvisorScoreBreakdown
}

export type DraftAdvisorStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'

/**
 * 本轮推荐所依据的数据缺口。主进程只报告"缺什么", 具体文案由渲染层按语言生成,
 * 避免把用户可见文本写死在这里。
 */
export interface DraftAdvisorDataGaps {
  /** 没有取到对位数据的敌方英雄 */
  missingEnemyChampionIds: number[]

  /** 没有取到协同数据的己方英雄 */
  missingAllyChampionIds: number[]

  /** 是否拿到了任何英雄的基础胜率 */
  hasBaseWinRates: boolean

  /**
   * 是否没能判定本方位置。
   *
   * 对位与协同数据都是按分路组织的, 位置未知时这两类信号整体不可用, 此时分数只由
   * 基础胜率支撑 —— 和上面"个别英雄缺数据"不是一回事, 因此单独标出来。
   */
  positionUnknown: boolean
}

export interface DraftAdvisorSnapshot {
  status: DraftAdvisorStatus

  patch: string | null

  /** 本次推荐所依据的位置; 无法判定时为 null */
  position: ChampionDataPosition | null

  /** 本方玩家已锁定或已意向的英雄, 尚未选择时为 null。面板用它标出阵容里的自己。 */
  selfChampionId: number | null

  allyMembers: DraftAdvisorTeamMember[]

  opponentMembers: DraftAdvisorTeamMember[]

  /** 双方阵容分; 数据不足时为 null */
  teamScore: DraftAdvisorTeamScore | null

  /** 我方候选榜, `teamScore` 是「我方选下他之后我方的阵容分」 */
  candidates: DraftAdvisorCandidate[]

  /** 对方候选榜, `teamScore` 是「对方选下他之后对方的阵容分」 */
  opponentCandidates: DraftAdvisorCandidate[]

  gaps: DraftAdvisorDataGaps

  updatedAt: number | null
}

export const EMPTY_DRAFT_ADVISOR_DATA_GAPS: DraftAdvisorDataGaps = {
  missingEnemyChampionIds: [],
  missingAllyChampionIds: [],
  hasBaseWinRates: false,
  positionUnknown: false
}

export const EMPTY_DRAFT_ADVISOR_SNAPSHOT: DraftAdvisorSnapshot = {
  status: 'idle',
  patch: null,
  position: null,
  selfChampionId: null,
  allyMembers: [],
  opponentMembers: [],
  teamScore: null,
  candidates: [],
  opponentCandidates: [],
  gaps: EMPTY_DRAFT_ADVISOR_DATA_GAPS,
  updatedAt: null
}
