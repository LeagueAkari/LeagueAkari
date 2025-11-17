import { TimelineFrame } from '@shared/types/league-client/match-history'
import { DetailedTimelineFrame } from '@shared/types/sgp/match-history'

import { LcuOrSgpGameDetails } from '../wrapper'

export function toFrames(details: LcuOrSgpGameDetails): (DetailedTimelineFrame | TimelineFrame)[] {
  const { source, data } = details

  if (source === 'sgp') {
    return data.json.frames
  }

  return data.frames
}
