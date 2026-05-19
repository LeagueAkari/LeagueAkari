import type { MatchBasicInfo } from '../../../match-history/match-basic'
import type { MatchParticipant } from '../../../match-history/participants'
import { EARLY_JUNGLE_INVOLVEMENT_LIMIT_MS } from '../constants'
import type { AnyTimelineFrame } from '../types/helpers'
import { getEnemyJunglerParticipantIds, isJunglerParticipant } from '../utils/geometry'

export function computeSingleEarlyDeathsWithEnemyJungler(
  frames: AnyTimelineFrame[],
  basic: MatchBasicInfo,
  participant: MatchParticipant,
  allParticipants: MatchParticipant[]
): number | null {
  if (basic.mapId !== 11 || basic.gameMode !== 'CLASSIC' || basic.gameType !== 'MATCHED_GAME') {
    return null
  }

  if (isJunglerParticipant(participant)) return null

  const enemyJunglerIds = getEnemyJunglerParticipantIds(participant, allParticipants)
  if (!enemyJunglerIds.length) return null

  const enemySet = new Set(enemyJunglerIds)
  let count = 0

  for (const frame of frames) {
    if (!frame.events) continue
    for (const event of frame.events) {
      if (event.type !== 'CHAMPION_KILL') continue
      if (event.timestamp > EARLY_JUNGLE_INVOLVEMENT_LIMIT_MS) continue

      if (event.victimId !== participant.participantId) continue

      const killed = enemySet.has(event.killerId)
      const assisted = event.assistingParticipantIds?.some((id) => enemySet.has(id)) ?? false

      if (killed || assisted) count++
    }
  }

  return count
}
