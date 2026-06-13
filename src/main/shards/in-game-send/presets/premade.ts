import {
  createPresetTeams,
  playerRiotId,
  premadeGroupsOfTeam,
  premadeSelectionSummaryLine,
  selectedPremadeIndices,
  targetTeamLabel,
  targetTeams
} from './helpers'
import type { InGameSendPresetContext } from './types'

export function buildPremadePresetLines(context: InGameSendPresetContext) {
  const allTeams = createPresetTeams(context)
  const selected = new Set(selectedPremadeIndices(context))
  const teams = targetTeams(context, allTeams)
  const lines = [
    `[组队状况 smoke:${targetTeamLabel(context.target)}]`,
    premadeSelectionSummaryLine(context, allTeams)
  ]

  if (!allTeams.length) {
    return [...lines, '当前没有 ongoing-game 玩家数据']
  }

  if (!teams.length) {
    return [...lines, '当前目标没有队伍数据']
  }

  const groupLines = teams.flatMap((team) => {
    const groups = premadeGroupsOfTeam(team).filter((group) => selected.has(group.groupIndex))

    if (!groups.length) {
      return [`[${team.primaryLabel}] 未选中开黑组或未检测到 2 人及以上开黑组`]
    }

    return groups.map((group) => {
      const members = group.players.map(playerRiotId).join(' / ')
      return `[${team.primaryLabel}] 组 ${group.groupLetter}(${group.players.length}) | ${members}`
    })
  })

  return [...lines, ...groupLines]
}
