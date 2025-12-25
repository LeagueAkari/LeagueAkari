import { TimelineFrame } from '@shared/types/league-client/match-history'
import { DetailedChampionKillEvent, DetailedTimelineFrame } from '@shared/types/sgp/match-history'

import { LcuOrSgpGameDetails } from '../wrapper'

export function isSgpChampionKillEvent(event: any): event is DetailedChampionKillEvent {
  if (typeof event !== 'object') return false

  return (
    event.type === 'CHAMPION_KILL' &&
    (Array.isArray(event.victimDamageDealt) || Array.isArray(event.victimDamageReceived))
  )
}

export function toFrames(details: LcuOrSgpGameDetails): (DetailedTimelineFrame | TimelineFrame)[] {
  const { source, data } = details

  if (source === 'sgp') {
    return data.json.frames
  }

  return data.frames
}
