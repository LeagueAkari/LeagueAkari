import { EMPTY_PUUID } from '@shared/constants/common'

import { toBasicInfo } from '../../match-history/match-basic'
import { toParticipants } from '../../match-history/participants'
import { LcuOrSgpGameSummary } from '../../wrapper'

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

  for (const game of games) {
    const basic = toBasicInfo(game)
    const participants = toParticipants(game, basic)
    const self = participants.find((p) => p.puuid === puuid)

    if (!self) {
      continue
    }

    for (const participant of participants) {
      if (!participant.puuid || participant.puuid === EMPTY_PUUID || participant.puuid === self.puuid) {
        continue
      }

      if (!relationship[participant.puuid]) {
        relationship[participant.puuid] = {
          selfProfileIconId: self.profileIconId,
          targetProfileIconId: participant.profileIconId,
          selfPuuid: self.puuid,
          targetPuuid: participant.puuid,
          targetGameName: participant.gameName,
          targetTagLine: participant.tagLine,
          games: []
        }
      }

      relationship[participant.puuid].games.push({
        gameId: basic.gameId,
        win: participant.win,
        isOpponent: participant.teamIdentifier !== self.teamIdentifier,
        selfChampionId: self.championId,
        targetChampionId: participant.championId
      })
    }
  }

  return relationship
}
