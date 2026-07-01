import { MatchParticipant } from '@shared/data-adapter/match-history/participants'

import { calculateCoefficientOfVariation, noZero } from '../../../utils'
import type { AggregatedSummaryAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import { avgIfAllNonNull, avgOrOne, avgOrZero } from '../utils/math'

/** 把 pings 各字段相加；pings 为 null 时返回 null（LCU 不提供） */
export function sumPings(pings: MatchParticipant['pings']): number | null {
  if (!pings) return null
  return (
    pings.allInPings +
    pings.assistMePings +
    pings.basicPings +
    pings.commandPings +
    pings.dangerPings +
    pings.enemyMissingPings +
    pings.enemyVisionPings +
    pings.getBackPings +
    pings.holdPings +
    pings.needVisionPings +
    pings.onMyWayPings +
    pings.pushPings +
    pings.retreatPings +
    pings.visionClearedPings
  )
}

export function computeAggregatedSummary(games: PreparedGame[]): AggregatedSummaryAnalysis {
  const summaries = games.map((g) => g.single.summary)
  const participants = games.map((g) => g.participant)
  const getVisionScore = (participant: MatchParticipant) => participant.visionScore ?? 0

  const kills = participants.reduce((s, p) => s + p.kills, 0)
  const deaths = participants.reduce((s, p) => s + p.deaths, 0)
  const assists = participants.reduce((s, p) => s + p.assists, 0)

  return {
    avgChampionDamageRatioToTeamMax: avgOrZero(
      summaries.map((s) => s.championDamageRatioToTeamMax)
    ),
    avgChampionDamageRatioToMax: avgOrZero(summaries.map((s) => s.championDamageRatioToMax)),
    avgChampionDamagePercentageOfTeam: avgOrZero(
      summaries.map((s) => s.championDamagePercentageOfTeam)
    ),
    avgChampionDamagePerMinute: avgOrZero(summaries.map((s) => s.championDamagePerMinute)),
    avgDamageTakenRatioToTeamMax: avgOrZero(summaries.map((s) => s.damageTakenRatioToTeamMax)),
    avgDamageTakenRatioToMax: avgOrZero(summaries.map((s) => s.damageTakenRatioToMax)),
    avgDamageTakenPercentageOfTeam: avgOrZero(summaries.map((s) => s.damageTakenPercentageOfTeam)),
    avgGoldRatioToTeamMax: avgOrZero(summaries.map((s) => s.goldRatioToTeamMax)),
    avgGoldRatioToMax: avgOrZero(summaries.map((s) => s.goldRatioToMax)),
    avgGoldPercentageOfTeam: avgOrZero(summaries.map((s) => s.goldPercentageOfTeam)),
    avgCsRatioToTeamMax: avgOrZero(summaries.map((s) => s.csRatioToTeamMax)),
    avgCsRatioToMax: avgOrZero(summaries.map((s) => s.csRatioToMax)),
    avgCsPercentageOfTeam: avgOrZero(summaries.map((s) => s.csPercentageOfTeam)),
    avgCsPerMinute: avgOrZero(summaries.map((s) => s.csPerMinute)),
    avgTowerDamageRatioToTeamMax: avgOrZero(summaries.map((s) => s.towerDamageRatioToTeamMax)),
    avgTowerDamageRatioToMax: avgOrZero(summaries.map((s) => s.towerDamageRatioToMax)),
    avgTowerDamagePercentageOfTeam: avgOrZero(summaries.map((s) => s.towerDamagePercentageOfTeam)),
    avgVisionScore: avgOrZero(participants.map(getVisionScore)),
    avgVisionScorePercentageOfTeam: avgOrZero(summaries.map((s) => s.visionScorePercentageOfTeam)),
    avgDamageGoldEfficiency: avgOrZero(summaries.map((s) => s.damageGoldEfficiency)),
    avgKillParticipation: avgOrZero(summaries.map((s) => s.killParticipation)),

    kills,
    deaths,
    assists,
    avgKda: (kills + assists) / noZero(deaths),
    kdaCv: calculateCoefficientOfVariation(participants.map((p) => p.kda)),
    winRate: participants.filter((p) => p.winResult === 'win').length / noZero(participants.length),

    avgSoloKills: avgIfAllNonNull(participants.map((p) => p.soloKills)),
    avgEnemyMissingPings: avgIfAllNonNull(
      participants.map((p) => p.pings?.enemyMissingPings ?? null)
    ),
    avgPings: avgIfAllNonNull(participants.map((p) => sumPings(p.pings))),

    avgKillDamageEfficiency: avgOrOne(summaries.map((s) => s.killDamageEfficiency))
  }
}
