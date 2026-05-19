import { MatchParticipant } from '../../../match-history/participants'
import { noZero } from '../../../utils'

/** 平均值；空数组返回 0（适用于场均、占比类） */
export function avgOrZero(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / noZero(values.length)
}

/** 平均值；空数组返回 null（适用于"首条龙时间"等没样本就别给数的指标） */
export function avgOrNull(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** 任一为 null 即返回 null（适用于 LCU 缺字段时整体放弃聚合） */
export function avgIfAllNonNull(values: (number | null)[]): number | null {
  if (values.length === 0) return null
  const allNonNull = values.every((v) => v !== null)
  if (!allNonNull) return null
  const nonNulls = values as number[]
  return nonNulls.reduce((s, v) => s + v, 0) / noZero(nonNulls.length)
}

/** 把 pings 各字段相加；pings 为 null 时返回 null（LCU 不提供） */
export function sumPings(pings: MatchParticipant['pings']): number | null {
  if (!pings) return null
  return (
    pings.allInPings +
    pings.assistMePings +
    pings.basicPings +
    pings.commandPings +
    pings.dangerPings +
    pings.enemyMissingPings +
    pings.enemyVisionPings +
    pings.getBackPings +
    pings.holdPings +
    pings.needVisionPings +
    pings.onMyWayPings +
    pings.pushPings +
    pings.retreatPings +
    pings.visionClearedPings
  )
}
