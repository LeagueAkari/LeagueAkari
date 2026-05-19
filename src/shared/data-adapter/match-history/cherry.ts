export function getCherryWinningTeamCount(teamCount: number) {
  return Math.floor(teamCount / 2)
}

export function getCherryTeamCount(
  participants: {
    playerSubteamId?: number
    subteamPlacement?: number
    teamIdentifier: string
  }[]
) {
  const teamIds = new Set<number | string>()

  for (const participant of participants) {
    if (participant.subteamPlacement !== undefined && participant.subteamPlacement <= 0) {
      continue
    }

    if (participant.playerSubteamId && participant.playerSubteamId > 0) {
      teamIds.add(participant.playerSubteamId)
      continue
    }

    if (participant.teamIdentifier.startsWith('CHERRY-')) {
      teamIds.add(participant.teamIdentifier)
    }
  }

  return teamIds.size
}

export function isCherryPlacementWin(placement: number, teamCount: number) {
  return placement > 0 && placement <= getCherryWinningTeamCount(teamCount)
}
