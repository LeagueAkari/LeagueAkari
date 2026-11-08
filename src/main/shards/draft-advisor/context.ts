import {
  MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT,
  MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT
} from '@shared/types/draft-advisor'

import type { ChampionDataMain } from '../champion-data'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { DraftAdvisorSettings, DraftAdvisorState } from './state'

export const DRAFT_ADVISOR_MAIN_NAMESPACE = 'draft-advisor-main'

/**
 * 推荐固定使用 QQ101 作为数据源。对位与协同是推荐的核心信号, 而在仓库现有的两个数据源
 * 中, 只有 QQ101 提供了可以按英雄独立批量抓取的 matchup / synergy 端点; OP.GG 侧的对位
 * 数据只能从"单个英雄完整详情"里获得, 无法支撑选人阶段的实时计算。
 *
 * 若日后 OP.GG 提供等价的独立端点, 这里换成偏好来源即可, 其余流程无需改动。
 */
export const DRAFT_ADVISOR_DATA_SOURCE = 'qq101'

/** 选人阶段状态变化频繁, 汇总计算前先等待一小段时间, 避免连续触发。 */
export const DRAFT_ADVISOR_RECOMPUTE_DEBOUNCE_MS = 600

/**
 * 候选展示数量的取值边界由 `@shared/types/draft-advisor` 统一提供, 渲染层与主进程
 * 共用同一份, 避免两边各写一个数字后逐渐漂移。
 */
export const DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT = MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT
export const DRAFT_ADVISOR_MAX_CANDIDATE_LIMIT = MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT

export interface DraftAdvisorMainContext {
  namespace: string
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: DraftAdvisorSettings
  state: DraftAdvisorState
  settingService: SetterSettingService<DraftAdvisorSettings>
  championData: ChampionDataMain
}
