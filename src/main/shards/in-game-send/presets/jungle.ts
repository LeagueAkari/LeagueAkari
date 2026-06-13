import {
  createPresetTeams,
  formatRate,
  isCurrentJungler,
  playerBaseLine,
  selectedPlayers,
  selectionSummaryLine,
  targetTeamLabel
} from './helpers'
import type { InGameSendPresetContext } from './types'

export function buildJunglePresetLines(context: InGameSendPresetContext) {
  const teams = createPresetTeams(context)
  const players = selectedPlayers(context, 'jungle', teams)
  const lines = [
    `[打野偏好 smoke:${targetTeamLabel(context.target)}]`,
    selectionSummaryLine(context, 'jungle', teams)
  ]

  if (!teams.length) {
    return [...lines, '当前没有 ongoing-game 玩家数据']
  }

  if (!players.length) {
    return [...lines, '当前目标没有选中的玩家']
  }

  return [
    ...lines,
    ...players.map(({ team, player }) => {
      const jungle = player.analysis?.jungle
      const currentRole = isCurrentJungler(player) ? '当前打野' : '非当前打野'
      const stats = jungle
        ? `样本 ${jungle.gamesAnalyzed} | 上/中/下 ${formatRate(jungle.avgTopZonePercentage)}/${formatRate(jungle.avgMidZonePercentage)}/${formatRate(jungle.avgBotZonePercentage)} | Lv3 ${formatRate(jungle.earlyGank.level3GankRate)} | Lv4 ${formatRate(jungle.earlyGank.level4GankRate)}`
        : '打野路径数据未加载'

      return `[${team.primaryLabel}] ${playerBaseLine(player)} | ${currentRole} | ${stats}`
    })
  ]
}
