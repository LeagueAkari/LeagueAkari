import type {
  InGameSendPremadePresetOptions,
  InGameSendPresetTarget
} from '@shared/shards/in-game-send'
import { getInGameSendPremadePresetShortcutTargetId } from '@shared/shards/in-game-send'

import type { InGameSendMainContext } from '../context'
import { createPresetTeams, targetTeams } from './helpers'
import { countSelectedChampionIds, playerDisplayName } from './name-display'
import type { InGameSendPresetContext, InGameSendPresetPlayer, InGameSendPresetTeam } from './types'

export type InGameSendPremadePresetLineOptions = Omit<
  InGameSendPremadePresetOptions,
  'targetShortcuts'
> & {
  selectedPremadeIndices: number[]
}

export const getPremadePresetShortcutTargetId = getInGameSendPremadePresetShortcutTargetId

export function createPremadePresetLineOptions(
  mainContext: InGameSendMainContext
): InGameSendPremadePresetLineOptions {
  const options = mainContext.settings.premadePresetOptions

  return {
    selectedPremadeIndices: mainContext.state.premadeIndices,
    nameDisplayStrategy: options.nameDisplayStrategy
  }
}

const PREMADE_TEAM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function premadeGroupsOfTeam(team: InGameSendPresetTeam) {
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

function premadeTeamTitle(team: InGameSendPresetTeam) {
  if (team.teamIdentifier === 'TEAM-100') {
    return '蓝方开黑'
  }

  if (team.teamIdentifier === 'TEAM-200') {
    return '红方开黑'
  }

  return '开黑'
}

function premadeNoGroupText(team: InGameSendPresetTeam) {
  if (team.teamIdentifier === 'TEAM-100') {
    return '蓝方无开黑'
  }

  if (team.teamIdentifier === 'TEAM-200') {
    return '红方无开黑'
  }

  return '无开黑小队'
}

export function buildPremadePresetLines(
  context: InGameSendPresetContext,
  options: InGameSendPremadePresetLineOptions
) {
  const allTeams = createPresetTeams(context)
  const selected = new Set(options.selectedPremadeIndices)
  const teams = targetTeams(context, allTeams)

  const selectedTeamGroups = teams.map((team) => ({
    team,
    groups: premadeGroupsOfTeam(team).filter((group) => selected.has(group.groupIndex))
  }))
  const players = selectedTeamGroups.flatMap(({ groups }) =>
    groups.flatMap((group) => group.players)
  )
  const selectedChampionIdCounts = countSelectedChampionIds(players)

  return selectedTeamGroups.map(({ team, groups }) => {
    if (groups.length === 0) {
      return premadeNoGroupText(team)
    }

    const groupParts = groups.map((group) => {
      const members = group.players
        .map((player) =>
          playerDisplayName(context, player, options.nameDisplayStrategy, selectedChampionIdCounts)
        )
        .join(', ')

      return `[${members}]`
    })

    return `${premadeTeamTitle(team)}：${groupParts.join(' ')}`
  })
}

export function buildPremadePresetLinesFromMainContext(
  mainContext: InGameSendMainContext,
  target: InGameSendPresetTarget
) {
  return buildPremadePresetLines(
    {
      target,
      mainContext
    },
    createPremadePresetLineOptions(mainContext)
  )
}
