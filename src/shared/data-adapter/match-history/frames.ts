import { TimelineFrame } from '@shared/types/league-client/match-history'
import {
  DetailedChampionKillEvent,
  DetailedParticipantFrame,
  DetailedTimelineFrame
} from '@shared/types/sgp/match-history'

import { LcuOrSgpGameDetails } from '../wrapper'

export function isSgpChampionKillEvent(event: any): event is DetailedChampionKillEvent {
  if (typeof event !== 'object') return false

  return (
    event.type === 'CHAMPION_KILL' &&
    (Array.isArray(event.victimDamageDealt) || Array.isArray(event.victimDamageReceived))
  )
}

export function isSgpDetailedTimelineFrame(frame: any): frame is DetailedTimelineFrame {
  if (typeof frame !== 'object') return false

  const anyFrame = frame?.participantFrames?.[1]

  return anyFrame && 'damageStats' in anyFrame && 'championStats' in anyFrame
}

export function isSgpDetailedParticipantFrame(frame: any): frame is DetailedParticipantFrame {
  if (typeof frame !== 'object') return false

  return 'damageStats' in frame && 'championStats' in frame
}

export function toFrames(details: LcuOrSgpGameDetails): (DetailedTimelineFrame | TimelineFrame)[] {
  const { source, data } = details

  if (source === 'sgp') {
    return data.json.frames
  }

  return data.frames
}
