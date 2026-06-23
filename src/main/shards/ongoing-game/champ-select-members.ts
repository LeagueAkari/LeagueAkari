import { magic } from '@main/native'
import { EMPTY_PUUID } from '@shared/constants/common'
import { ChampSelectSession, ChampSelectTeam } from '@shared/types/league-client/champ-select'

export interface ChampSelectVisibilityConfigLike {
  spotlight: {
    deobfuscation: boolean
  }
}

export interface VisibleChampSelectMember {
  puuid: string
  teamIdentifier: string
  championId: number
  position: string
  spell1Id: number
  spell2Id: number
}

export function collectVisibleChampSelectMembers(
  session: ChampSelectSession,
  config: ChampSelectVisibilityConfigLike
): VisibleChampSelectMember[] {
  const members: VisibleChampSelectMember[] = []

  const collectMember = (member: ChampSelectTeam) => {
    const puuid = getVisibleChampSelectPuuid(member, config)
    if (!puuid) {
      return
    }

    const teamIdentifier = member.team === 100 || member.team === 1 ? 'TEAM-100' : 'TEAM-200'
    members.push({
      puuid,
      teamIdentifier,
      championId: member.championId || member.championPickIntent || 0,
      position: member.assignedPosition.toUpperCase(),
      spell1Id: member.spell1Id || 0,
      spell2Id: member.spell2Id || 0
    })
  }

  session.myTeam.forEach(collectMember)
  session.theirTeam.forEach(collectMember)

  return members
}

export function getVisibleChampSelectPuuid(
  member: ChampSelectTeam,
  config: ChampSelectVisibilityConfigLike
) {
  if (
    member.nameVisibilityType === 'HIDDEN' &&
    member.obfuscatedPuuid &&
    config.spotlight.deobfuscation
  ) {
    return magic(member.obfuscatedPuuid) || null
  }

  if (!member.puuid || member.puuid === EMPTY_PUUID) {
    return null
  }

  return member.puuid
}
