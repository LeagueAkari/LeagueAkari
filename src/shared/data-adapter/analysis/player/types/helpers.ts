import { MatchBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { MatchParticipant } from '@shared/data-adapter/match-history/participants'

import { toFrames } from '../../../match-history/frames'
import { SingleAnalysis } from './single'

export type GankLane = 'top' | 'mid' | 'bot'
export type CampSide = 'blue' | 'red'
export type JungleCamp = 'red' | 'blue' | 'wolves' | 'raptors'

export interface GankPoint {
  x: number
  y: number
  lane: GankLane
}

export interface MinutePositionPoint {
  x: number
  y: number
  lane: GankLane
  minute: number
}

export type AnyTimelineFrame = ReturnType<typeof toFrames>[number]

export interface PreparedGame {
  gameId: number
  basic: MatchBasicInfo
  participant: MatchParticipant
  participants: MatchParticipant[]
  single: SingleAnalysis
}
