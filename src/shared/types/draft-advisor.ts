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

export interface DraftAdvisorCandidate {
  championId: number

  /** 综合推荐分, 与胜率同量纲, 便于直接展示 */
  score: number

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
}

export interface DraftAdvisorSnapshot {
  status: DraftAdvisorStatus

  patch: string | null

  /** 本次推荐所依据的位置; 无法判定时为 null */
  position: ChampionDataPosition | null

  allyChampionIds: number[]

  enemyChampionIds: number[]

  candidates: DraftAdvisorCandidate[]

  gaps: DraftAdvisorDataGaps

  updatedAt: number | null
}

export const EMPTY_DRAFT_ADVISOR_DATA_GAPS: DraftAdvisorDataGaps = {
  missingEnemyChampionIds: [],
  missingAllyChampionIds: [],
  hasBaseWinRates: false
}

export const EMPTY_DRAFT_ADVISOR_SNAPSHOT: DraftAdvisorSnapshot = {
  status: 'idle',
  patch: null,
  position: null,
  allyChampionIds: [],
  enemyChampionIds: [],
  candidates: [],
  gaps: EMPTY_DRAFT_ADVISOR_DATA_GAPS,
  updatedAt: null
}
