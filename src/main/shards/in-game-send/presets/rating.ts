import {
  createPresetTeams,
  formatRate,
  playerBaseLine,
  selectedPlayers,
  selectionSummaryLine,
  targetTeamLabel
} from './helpers'
import type { InGameSendPresetContext } from './types'

export function buildRatingPresetLines(context: InGameSendPresetContext) {
  const teams = createPresetTeams(context)
  const players = selectedPlayers(context, 'rating', teams)
  const lines = [
    `[表现评分 smoke:${targetTeamLabel(context.target)}]`,
    selectionSummaryLine(context, 'rating', teams)
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
      const analysis = player.analysis
      const stats = analysis
        ? `样本 ${analysis.count} | 胜率 ${formatRate(analysis.winLoss.all.winRate)} | KDA ${analysis.summary.avgKda.toFixed(2)} | Akari ${analysis.akariScore.total.toFixed(1)}`
        : '分析数据未加载'

      return `[${team.primaryLabel}] ${playerBaseLine(player)} | ${stats}`
    })
  ]
}
