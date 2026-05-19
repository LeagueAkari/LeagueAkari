import { CampSide, JungleCamp } from './types/helpers'

/** 打野分析所考察的前 N 分钟 */
export const ANALYSIS_MINUTES = 14

/** 首清营地看第几帧（1 = 1 分钟时的位置） */
export const FIRST_CLEAR_FRAME = 1

/** 击杀参与相对于时间线位置的权重 */
export const KILL_WEIGHT = 5

/** 早期阵亡分析窗口（毫秒） */
export const EARLY_JUNGLE_INVOLVEMENT_LIMIT_MS = 15 * 60 * 1000

/** 活跃 session：最近一场必须在 8h 内才开始累加 */
export const ACTIVE_SESSION_LATEST_WINDOW_MS = 4 * 60 * 60 * 1000

/** 活跃 session：相邻场次最大间隔 */
export const ACTIVE_SESSION_GAP_MS = 8 * 60 * 60 * 1000

/** Akari KDA 分数权重 */
export const AKARI_KDA_WEIGHT = 1.44

/** Akari 胜率基准线 */
export const AKARI_WIN_RATE_BASELINE = 0.5

/** Akari 胜率分数权重 */
export const AKARI_WIN_RATE_WEIGHT = 4

/** Akari 输出分数权重 */
export const AKARI_DAMAGE_WEIGHT = 10.0

/** Akari 承伤分数权重 */
export const AKARI_DAMAGE_TAKEN_WEIGHT = 8.0

/** Akari 补刀倍率缩放系数 */
export const AKARI_CS_SCALING_FACTOR = 0.04

/** Akari 补刀倍率下限 */
export const AKARI_CS_MIN_MULTIPLIER = 0.1

/** Akari 补刀倍率上限 */
export const AKARI_CS_MAX_MULTIPLIER = 0.4

/** Akari 经济分数权重 */
export const AKARI_GOLD_WEIGHT = 4.0

/** Akari 参团分数权重 */
export const AKARI_PARTICIPATION_WEIGHT = 4

/** 聚合 Akari outstanding 阈值 */
export const AGGREGATE_AKARI_OUTSTANDING_THRESHOLD = 26.0

/** 聚合 Akari outstanding 最小样本数 */
export const AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT = 5

/** 聚合 Akari extraordinary 阈值 */
export const AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD = 30.0

/** 聚合 Akari extraordinary 最小样本数 */
export const AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT = 8

export interface CampCoord {
  x: number
  y: number
  camp: JungleCamp
  side: CampSide
}

export const BLUE_SIDE_CAMPS: CampCoord[] = [
  { x: 3830, y: 7880, camp: 'blue', side: 'blue' },
  { x: 3800, y: 6440, camp: 'wolves', side: 'blue' },
  { x: 7760, y: 4010, camp: 'red', side: 'blue' },
  { x: 6970, y: 5460, camp: 'raptors', side: 'blue' }
]

export const RED_SIDE_CAMPS: CampCoord[] = [
  { x: 10990, y: 7000, camp: 'blue', side: 'red' },
  { x: 11020, y: 8440, camp: 'wolves', side: 'red' },
  { x: 7060, y: 10870, camp: 'red', side: 'red' },
  { x: 7850, y: 9420, camp: 'raptors', side: 'red' }
]
