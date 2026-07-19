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

/** Akari KDA 起评分 */
export const AKARI_KDA_BASELINE = 2

/** Akari KDA 分数权重 */
export const AKARI_KDA_WEIGHT = 3 / 7

/** Akari KDA 分数满分 */
export const AKARI_KDA_MAX_SCORE = 1

/** Akari 胜率基准线 */
export const AKARI_WIN_RATE_BASELINE = 0.5

/** Akari 胜率分数权重 */
export const AKARI_WIN_RATE_WEIGHT = 1

/** Akari 输出分数权重 */
export const AKARI_DAMAGE_WEIGHT = 3

/** Akari 承伤分数权重 */
export const AKARI_DAMAGE_TAKEN_WEIGHT = 2

/** Akari 治疗起评分所需的本队平均承伤比例 */
export const AKARI_HEALING_MIN_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO = 0.2

/** Akari 多人队伍治疗满分所需的本队平均承伤比例 */
export const AKARI_HEALING_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO = 1.4

/** Akari 单人队伍治疗满分所需的本队平均承伤比例 */
export const AKARI_HEALING_SOLO_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO = 1

/** Akari 治疗分数满分 */
export const AKARI_HEALING_MAX_SCORE = 2

/** Akari 补刀满分所需分均补刀 */
export const AKARI_CS_FULL_SCORE_PER_MINUTE = 10

/** Akari 补刀起评分均补刀 */
export const AKARI_CS_MIN_SCORE_PER_MINUTE = 5

/** Akari 补刀分数满分 */
export const AKARI_CS_MAX_SCORE = 2

/** Akari 经济分数权重 */
export const AKARI_GOLD_WEIGHT = 2

/** Akari 参团率起评分 */
export const AKARI_PARTICIPATION_MIN_SHARE = 0.3

/** Akari 参团分数满分 */
export const AKARI_PARTICIPATION_WEIGHT = 2

/** Akari 伤害、承伤、视野满分所需理应贡献比 */
export const AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO = 2.0

/** Akari 理应贡献起评分比 */
export const AKARI_EXPECTED_CONTRIBUTION_BASELINE_RATIO = 1.0

/** Akari 经济满分所需理应贡献比 */
export const AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO = 1.5

/** Akari 视野分数满分 */
export const AKARI_VISION_MAX_SCORE = 2

/** Akari 总分满分 */
export const AKARI_MAX_SCORE =
  AKARI_KDA_MAX_SCORE +
  AKARI_WIN_RATE_WEIGHT +
  AKARI_DAMAGE_WEIGHT +
  AKARI_DAMAGE_TAKEN_WEIGHT +
  AKARI_HEALING_MAX_SCORE +
  AKARI_CS_MAX_SCORE +
  AKARI_GOLD_WEIGHT +
  AKARI_PARTICIPATION_WEIGHT +
  AKARI_VISION_MAX_SCORE

/** 聚合 Akari outstanding 阈值 */
export const AGGREGATE_AKARI_OUTSTANDING_THRESHOLD = 6.5

/** 聚合 Akari outstanding 最小样本数 */
export const AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT = 5

/** 聚合 Akari extraordinary 阈值 */
export const AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD = 8

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
