import { toFrames } from '../../../match-history/frames'
import type { MatchBasicInfo } from '../../../match-history/match-basic'
import type { MatchParticipant } from '../../../match-history/participants'
import type { LcuOrSgpGameDetails } from '../../../wrapper'
import type { SingleDetailsAnalysis } from '../types/single'
import { isJunglerParticipant } from '../utils/geometry'
import { computeSingleEarlyDeathsWithEnemyJungler } from './early-deaths'
import { computeSingleJungle } from './jungle'
import { computeSingleObjectives } from './objectives'

/**
 * 单场 details 分析：从 timeline/frames 中提取所有 summary 无法获得的指标
 *
 * - `objectives`：团队野怪目标，任意模式下均计算
 * - `earlyDeathsWithEnemyJunglerInvolved`：仅在峡谷经典匹配且玩家非打野、敌方有打野时有效
 * - `jungle`：仅在玩家是打野（position=JUNGLE 或携带惩戒）且地图为召唤师峡谷时有效
 */
export function computeSingleDetails(
  details: LcuOrSgpGameDetails,
  basic: MatchBasicInfo,
  participant: MatchParticipant,
  allParticipants: MatchParticipant[]
): SingleDetailsAnalysis {
  const frames = toFrames(details)

  const objectives = computeSingleObjectives(frames, participant)
  const earlyDeathsWithEnemyJunglerInvolved = computeSingleEarlyDeathsWithEnemyJungler(
    frames,
    basic,
    participant,
    allParticipants
  )
  const jungle =
    basic.mapId === 11 && isJunglerParticipant(participant)
      ? computeSingleJungle(frames, participant)
      : null

  return {
    objectives,
    earlyDeathsWithEnemyJunglerInvolved,
    jungle
  }
}
