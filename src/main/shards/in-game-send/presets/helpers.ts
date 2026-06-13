import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import type { InGameSendPresetTarget } from '@shared/types/shards/in-game-send'

import type { InGameSendPresetContext, InGameSendPresetPlayer, InGameSendPresetTeam } from './types'

export const PREMADE_TEAM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function formatRate(rate: number) {
  return `${(rate * 100).toFixed(0)}%`
}

export function playerRiotId(player: InGameSendPresetPlayer) {
  return player.tagLine ? `${player.gameName}#${player.tagLine}` : player.gameName
}

export function playerPositionLabel(player: InGameSendPresetPlayer) {
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

export function getTeamSortValue(teamId: string) {
  if (teamId === 'TEAM-100') return 100
  if (teamId === 'TEAM-200') return 200

  const cherrySubteam = teamId.match(/^CHERRY-(\d+)$/)
  if (cherrySubteam) {
    return 1000 + Number(cherrySubteam[1])
  }

  return Number.MAX_SAFE_INTEGER
}

export function compareTeamIds(teamIdA: string, teamIdB: string, selfTeamId: string | null) {
  if (selfTeamId) {
    if (teamIdA === selfTeamId) return -1
    if (teamIdB === selfTeamId) return 1
  }

  const sortA = getTeamSortValue(teamIdA)
  const sortB = getTeamSortValue(teamIdB)

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return teamIdA.localeCompare(teamIdB)
}

export function getTeamLabels(teamId: string, selfTeamId: string | null) {
  if (!selfTeamId) {
    return {
      label: teamId,
      primaryLabel: teamId
    }
  }

  const primaryLabel = teamId === selfTeamId ? '我方' : '敌方'

  return {
    label: `${primaryLabel} · ${teamId}`,
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
  const selfTeamId = selfTeamEntry?.[0] ?? null

  const teams: InGameSendPresetTeam[] = Object.entries(ongoingGameState.teams)
    .toSorted(([teamIdA], [teamIdB]) => {
      return compareTeamIds(teamIdA, teamIdB, selfTeamId)
    })
    .map(([teamId, puuids]) => {
      const labels = getTeamLabels(teamId, selfTeamId)

      return {
        id: teamId,
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

export function selectedPuuids(context: InGameSendPresetContext, presetId: 'rating' | 'jungle') {
  const { state } = context.mainContext
  return presetId === 'rating' ? state.ratingPuuids : state.junglePuuids
}

export function selectedPremadeIndices(context: InGameSendPresetContext) {
  return context.mainContext.state.premadeIndices
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

export function selectedPlayers(
  context: InGameSendPresetContext,
  presetId: 'rating' | 'jungle',
  teams = createPresetTeams(context)
) {
  const selected = new Set(selectedPuuids(context, presetId))

  return targetTeams(context, teams)
    .flatMap((team) => team.players.map((player) => ({ team, player })))
    .filter(({ player }) => selected.has(player.puuid))
}

export function selectionSummaryLine(
  context: InGameSendPresetContext,
  presetId: 'rating' | 'jungle',
  teams = createPresetTeams(context)
) {
  const selected = new Set(selectedPuuids(context, presetId))
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

export function isCurrentJungler(player: InGameSendPresetPlayer) {
  const position = player.position?.toUpperCase()

  return (
    position === 'JUNGLE' ||
    player.spells?.spell1Id === SUMMONER_SPELL_SMITE_ID ||
    player.spells?.spell2Id === SUMMONER_SPELL_SMITE_ID
  )
}

export function premadeGroupsOfTeam(team: InGameSendPresetTeam) {
  const byGroup = new Map<number, InGameSendPresetPlayer[]>()

  for (const player of team.players) {
    if (player.premadeGroup == null) {
      continue
    }

    const players = byGroup.get(player.premadeGroup) ?? []
    players.push(player)
    byGroup.set(player.premadeGroup, players)
  }

  return [...byGroup.entries()]
    .toSorted(([a], [b]) => a - b)
    .filter(([, players]) => players.length >= 2)
    .map(([groupIndex, players]) => ({
      groupIndex,
      groupLetter: PREMADE_TEAM_LETTERS[groupIndex - 1] ?? String(groupIndex),
      players
    }))
}

export function premadeSelectionSummaryLine(
  context: InGameSendPresetContext,
  teams = createPresetTeams(context)
) {
  const selected = new Set(selectedPremadeIndices(context))
  const selectedCount = [...selected].filter((index) =>
    teams.some((team) => premadeGroupsOfTeam(team).some((group) => group.groupIndex === index))
  ).length

  if (selectedCount === 0) {
    return '[选中: 无]'
  }

  const parts: string[] = []

  for (const team of teams) {
    const groupParts = premadeGroupsOfTeam(team)
      .filter((group) => selected.has(group.groupIndex))
      .map((group) => `${group.groupLetter}(${group.players.length})`)

    if (groupParts.length) {
      parts.push(`${team.label} 组 ${groupParts.join('+')}`)
    }
  }

  return `[选中: ${parts.join(' | ')}]`
}
