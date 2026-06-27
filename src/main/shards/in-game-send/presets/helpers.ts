import type { InGameSendPresetTarget } from '@shared/shards/in-game-send'

import type { InGameSendPresetContext, InGameSendPresetPlayer, InGameSendPresetTeam } from './types'

export function formatRate(rate: number) {
  return `${(rate * 100).toFixed(0)}%`
}

function playerRiotId(player: InGameSendPresetPlayer) {
  return player.tagLine ? `${player.gameName}#${player.tagLine}` : player.gameName
}

function playerPositionLabel(player: InGameSendPresetPlayer) {
  if (!player.position || player.position === 'NONE') {
    return '位置未知'
  }

  return player.position
}

export function playerBaseLine(player: InGameSendPresetPlayer) {
  const champion = player.championId ? `英雄 ${player.championId}` : '英雄未定'
  return `${playerPositionLabel(player)} ${playerRiotId(player)} | ${champion}`
}

export function targetTeamLabel(target: InGameSendPresetTarget) {
  switch (target) {
    case 'friendly':
      return '我方'
    case 'enemy':
      return '敌方'
    case 'all':
      return '全体'
  }
}

function getTeamIdentifierSortValue(teamIdentifier: string) {
  if (teamIdentifier === 'TEAM-100') return 100
  if (teamIdentifier === 'TEAM-200') return 200

  const cherrySubteam = teamIdentifier.match(/^CHERRY-(\d+)$/)
  if (cherrySubteam) {
    return 1000 + Number(cherrySubteam[1])
  }

  return Number.MAX_SAFE_INTEGER
}

function compareTeamIdentifiers(
  teamIdentifierA: string,
  teamIdentifierB: string,
  selfTeamIdentifier: string | null
) {
  if (selfTeamIdentifier) {
    if (teamIdentifierA === selfTeamIdentifier) return -1
    if (teamIdentifierB === selfTeamIdentifier) return 1
  }

  const sortA = getTeamIdentifierSortValue(teamIdentifierA)
  const sortB = getTeamIdentifierSortValue(teamIdentifierB)

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return teamIdentifierA.localeCompare(teamIdentifierB)
}

function getTeamLabels(teamIdentifier: string, selfTeamIdentifier: string | null) {
  if (!selfTeamIdentifier) {
    return {
      label: teamIdentifier,
      primaryLabel: teamIdentifier
    }
  }

  const primaryLabel = teamIdentifier === selfTeamIdentifier ? '我方' : '敌方'

  return {
    label: `${primaryLabel} · ${teamIdentifier}`,
    primaryLabel
  }
}

export function createPresetTeams(context: InGameSendPresetContext) {
  const { leagueClient, ongoingGame } = context.mainContext
  const ongoingGameState = ongoingGame.state
  const selfPuuid = leagueClient.data.summoner.me?.puuid
  const selfTeamEntry = selfPuuid
    ? Object.entries(ongoingGameState.teams).find(([, puuids]) => puuids.includes(selfPuuid))
    : null
  const selfTeamIdentifier = selfTeamEntry?.[0] ?? null

  const teams: InGameSendPresetTeam[] = Object.entries(ongoingGameState.teams)
    .toSorted(([teamIdentifierA], [teamIdentifierB]) => {
      return compareTeamIdentifiers(teamIdentifierA, teamIdentifierB, selfTeamIdentifier)
    })
    .map(([teamIdentifier, puuids]) => {
      const labels = getTeamLabels(teamIdentifier, selfTeamIdentifier)

      return {
        teamIdentifier,
        ...labels,
        players: puuids.map((puuid) => {
          const summoner = ongoingGameState.summoner[puuid]

          return {
            puuid,
            championId: ongoingGameState.championSelections[puuid] ?? 0,
            gameName: summoner?.gameName || summoner?.displayName || puuid.slice(0, 6),
            tagLine: summoner?.tagLine || '',
            position: ongoingGameState.positionAssignments[puuid]?.position ?? null,
            premadeGroup: ongoingGameState.mergedPremadeTeamMap[puuid] || undefined,
            analysis: ongoingGameState.analysis?.players[puuid],
            spells: ongoingGameState.additional.spells[puuid]
          }
        })
      }
    })

  return teams.filter((team) => team.players.length > 0)
}

export function targetTeams(context: InGameSendPresetContext, teams = createPresetTeams(context)) {
  if (context.target === 'all') {
    return teams
  }

  const primaryLabel = context.target === 'friendly' ? '我方' : '敌方'
  const matched = teams.filter((team) => team.primaryLabel === primaryLabel)
  if (matched.length) {
    return matched
  }

  return context.target === 'friendly' ? teams.slice(0, 1) : teams.slice(1)
}

export function selectedPlayersByPuuids(
  context: InGameSendPresetContext,
  selectedPuuids: string[],
  teams = createPresetTeams(context)
) {
  const selected = new Set(selectedPuuids)

  return targetTeams(context, teams)
    .flatMap((team) => team.players.map((player) => ({ team, player })))
    .filter(({ player }) => selected.has(player.puuid))
}

export function selectionSummaryLineByPuuids(
  selectedPuuids: string[],
  teams: InGameSendPresetTeam[]
) {
  const selected = new Set(selectedPuuids)
  const count = teams
    .flatMap((team) => team.players)
    .reduce((acc, player) => acc + (selected.has(player.puuid) ? 1 : 0), 0)

  if (count === 0) {
    return '[选中: 无]'
  }

  const parts = teams.map((team) => {
    const teamCount = team.players.reduce(
      (acc, player) => acc + (selected.has(player.puuid) ? 1 : 0),
      0
    )
    return `${team.label} ${teamCount}`
  })

  return `[选中: ${parts.join(' / ')}]`
}
