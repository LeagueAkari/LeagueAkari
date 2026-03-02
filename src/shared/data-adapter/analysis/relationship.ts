import { EMPTY_PUUID } from '@shared/constants/common'
import { isPveQueue } from '@shared/types/league-client/match-history'

import { toBasicInfo } from '../match-history/match-basic'
import { toParticipants } from '../match-history/participants'
import { LcuOrSgpGameSummary } from '../wrapper'

export interface GameRelationship {
  selfPuuid: string
  targetPuuid: string
  targetGameName: string
  targetTagLine: string
  games: {
    gameId: number
    win: boolean
    isOpponent: boolean
    selfChampionId: number
    targetChampionId: number
  }[]
  selfProfileIconId: number
  targetProfileIconId: number
}

export function analyzeRelationship(games: LcuOrSgpGameSummary[], puuid: string) {
  const relationship: Record<string, GameRelationship> = {}

  for (const summary of games) {
    const basicInfo = toBasicInfo(summary)

    if (basicInfo.gameType !== 'MATCHED_GAME') {
      continue
    }

    if (isPveQueue(basicInfo.queueId)) {
      continue
    }

    const participants = toParticipants(summary, basicInfo).filter(
      (participant) => participant.puuid && participant.puuid !== EMPTY_PUUID
    )

    const selfParticipant = participants.find((participant) => participant.puuid === puuid)

    if (!selfParticipant) {
      continue
    }

    for (const participant of participants) {
      if (participant.puuid === puuid) {
        continue
      }

      if (!relationship[participant.puuid]) {
        relationship[participant.puuid] = {
          selfProfileIconId: selfParticipant.profileIconId,
          targetProfileIconId: participant.profileIconId,
          selfPuuid: puuid,
          targetPuuid: participant.puuid,
          targetGameName: participant.gameName,
          targetTagLine: participant.tagLine,
          games: []
        }
      }

      relationship[participant.puuid].games.push({
        gameId: basicInfo.gameId,
        win: participant.win,
        isOpponent: participant.teamIdentifier !== selfParticipant.teamIdentifier,
        selfChampionId: selfParticipant.championId,
        targetChampionId: participant.championId
      })
    }
  }

  return relationship
}
