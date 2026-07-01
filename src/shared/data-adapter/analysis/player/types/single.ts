import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '../../../wrapper'
import { CampSide, GankPoint, JungleCamp, MinutePositionPoint } from './helpers'

export interface AkariScore {
  kdaScore: number
  winRateScore: number
  dmgScore: number
  dmgTakenScore: number
  csScore: number
  goldScore: number
  participationScore: number
  visionScore: number
  total: number
  outstanding: boolean
  extraordinary: boolean
}

export interface AkariScoreInput {
  kda: number
  winRate: number
  championDamageRatioToTeamMax: number
  championDamageRatioToExpectedContribution: number
  damageTakenRatioToTeamMax: number
  damageTakenRatioToExpectedContribution: number
  csPerMinute: number
  goldRatioToTeamMax: number
  goldRatioToExpectedContribution: number
  killParticipation: number
  visionScorePercentageOfTeam: number
  visionScoreRatioToExpectedContribution: number
  count: number
}

export interface GameSummaryWithOptionalDetails {
  gameId: number
  summary: LcuOrSgpGameSummary
  details?: LcuOrSgpGameDetails
}

export interface SingleSummaryAnalysis {
  championDamageRatioToTeamMax: number
  championDamageRatioToExpectedContribution: number
  championDamageRatioToMax: number
  championDamagePercentageOfTeam: number
  championDamagePerMinute: number
  damageTakenRatioToTeamMax: number
  damageTakenRatioToExpectedContribution: number
  damageTakenRatioToMax: number
  damageTakenPercentageOfTeam: number
  goldRatioToTeamMax: number
  goldRatioToExpectedContribution: number
  goldRatioToMax: number
  goldPercentageOfTeam: number
  csRatioToTeamMax: number
  csRatioToMax: number
  csPercentageOfTeam: number
  csPerMinute: number
  towerDamageRatioToTeamMax: number
  towerDamageRatioToMax: number
  towerDamagePercentageOfTeam: number
  visionScorePercentageOfTeam: number
  visionScoreRatioToExpectedContribution: number
  totalDamageShieldedOnTeammatesRatioToTeamMax: number | null
  totalDamageShieldedOnTeammatesRatioToMax: number | null
  totalDamageShieldedOnTeammatesPercentageOfTeam: number | null
  killDamageEfficiency: number
  kda: number
  win: boolean
  killParticipation: number
  damageGoldEfficiency: number
}

/**
 * 团队级野怪目标统计（所有玩家通用，与角色无关）
 */
export interface SingleObjectivesAnalysis {
  /** 我方是否拿到一血龙；全场无小龙时为 null */
  gotFirstDragon: boolean | null
  /** 我方拿到的小龙数 */
  dragons: number
  /** 玩家本人单杀的小龙数（killer===self 且无助攻） */
  soloDragons: number
  /** 我方首条小龙时间（秒） */
  firstDragonTime: number | null
  voidgrubs: number
  firstVoidgrubTime: number | null
  heralds: number
  firstHeraldTime: number | null
  barons: number
  firstBaronTime: number | null
}

/**
 * 打野专属：玩家不是打野（无惩戒且非 JUNGLE 位）或非召唤师峡谷时整体为 null
 */
export interface SingleJungleAnalysis {
  /** 地图三分区权重和（前 14 分钟，时间线位置权重 1 + 击杀参与权重 5） */
  topZoneWeightSum: number
  midZoneWeightSum: number
  botZoneWeightSum: number
  totalZoneWeightSum: number

  /** 前 14 分钟 Gank 计数（按线） */
  topGanks: number
  midGanks: number
  botGanks: number

  /** 首清营地，frame[1] 不可用时为 null */
  startCamp: { camp: JungleCamp; side: CampSide } | null

  /** 3 级时检测到对英雄造成伤害（不一定击杀） */
  level3GankDetected: boolean
  /** 4 级时检测到新增英雄伤害（独立于 3 级抓） */
  level4GankDetected: boolean
  /** 3 分钟内的击杀参与位置 */
  level3KillPositions: GankPoint[]
  /** 3-4 分钟之间的击杀参与位置 */
  level4KillPositions: GankPoint[]

  /** 前 14 分钟所有 Gank 类击杀坐标（用于地图可视化） */
  gankPositions: GankPoint[]
  /** 前 14 分钟整分钟位置点（用于地图可视化） */
  minutePositions: MinutePositionPoint[]
}

/**
 * 通过 summary + details 数据计算而来
 */
export interface SingleDetailsAnalysis {
  objectives: SingleObjectivesAnalysis

  earlyDeathsWithEnemyJunglerInvolved: number | null

  jungle: SingleJungleAnalysis | null
}

export interface SingleAnalysis {
  gameId: number

  summary: SingleSummaryAnalysis
  details: SingleDetailsAnalysis | null
  akariScore: AkariScore
}
