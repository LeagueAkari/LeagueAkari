import { LcuOrSgpGameSummary } from '../wrapper'

export type MatchParticipantIdentity = {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  participantId: number
  teamId: number // raw
}

export function toIdentities(summary: LcuOrSgpGameSummary): MatchParticipantIdentity[] {
  if (summary.source === 'sgp') {
    return summary.data.json.participants.map((participant) => ({
      puuid: participant.puuid,
      gameName: participant.riotIdGameName,
      tagLine: participant.riotIdTagline,
      profileIconId: participant.profileIcon,
      participantId: participant.participantId,
      teamId: participant.teamId
    }))
  }

  const teamIdMap = new Map<number, number>()

  summary.data.participants.forEach((participant) => {
    teamIdMap.set(participant.participantId, participant.teamId)
  })

  return summary.data.participantIdentities.map((identity) => ({
    puuid: identity.player.puuid,
    gameName: identity.player.gameName,
    tagLine: identity.player.tagLine,
    profileIconId: identity.player.profileIcon,
    participantId: identity.participantId,
    teamId: teamIdMap.get(identity.participantId) ?? 0
  }))
}
