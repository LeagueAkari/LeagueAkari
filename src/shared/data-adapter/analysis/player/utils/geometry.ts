import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'

import { MatchParticipant } from '../../../match-history/participants'
import { BLUE_SIDE_CAMPS, CampCoord, RED_SIDE_CAMPS } from '../constants'
import type { CampSide, GankLane, JungleCamp } from '../types/helpers'

/** 找到坐标最近的营地，用于首清判断 */
export function detectStartCamp(x: number, y: number): { camp: JungleCamp; side: CampSide } {
  const camps = [...BLUE_SIDE_CAMPS, ...RED_SIDE_CAMPS]
  let minDist = Infinity
  let nearest: CampCoord = camps[0]
  for (const c of camps) {
    const dx = x - c.x
    const dy = y - c.y
    const dist = dx * dx + dy * dy
    if (dist < minDist) {
      minDist = dist
      nearest = c
    }
  }
  return { camp: nearest.camp, side: nearest.side }
}

/** 地图三分区分类（用于位置热力聚合，任何坐标都会被归到 top/mid/bot 之一） */
export function classifyMapZone(x: number, y: number): GankLane {
  if (x < 5000 && y > 9000) return 'top'
  if (x > 9000 && y < 5000) return 'bot'

  const distFromDiag = Math.abs(y - x)
  if (distFromDiag <= 3500) return 'mid'

  return y > x ? 'top' : 'bot'
}

/** Gank 路线分类（比 classifyMapZone 更严格；非典型位置返回 null） */
export function classifyGankLane(x: number, y: number): GankLane | null {
  if (x < 5000 && y > 9000) return 'top'
  if (x > 9000 && y < 5000) return 'bot'

  const distFromDiag = Math.abs(y - x)
  const midPoint = (x + y) / 2
  if (distFromDiag < 4000 && midPoint > 3000 && midPoint < 12000) return 'mid'

  return null
}

export function isJunglerParticipant(p: MatchParticipant): boolean {
  return p.position === 'JUNGLE' || p.spells.includes(SUMMONER_SPELL_SMITE_ID)
}

/** 从对局中找到敌方打野的 participantId 集合（优先按 position，回落到惩戒） */
export function getEnemyJunglerParticipantIds(
  self: MatchParticipant,
  allParticipants: MatchParticipant[]
): number[] {
  const enemies = allParticipants.filter((p) => p.teamId !== self.teamId)
  const byPosition = enemies.filter((p) => p.position === 'JUNGLE')
  if (byPosition.length) return byPosition.map((p) => p.participantId)

  const bySmite = enemies.filter((p) => p.spells.includes(SUMMONER_SPELL_SMITE_ID))
  if (bySmite.length) return bySmite.map((p) => p.participantId)

  return []
}
