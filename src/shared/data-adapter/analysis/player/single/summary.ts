import { MatchBasicInfo } from '../../../match-history/match-basic'
import { MatchParticipant } from '../../../match-history/participants'
import { noZero } from '../../../utils'
import type { SingleSummaryAnalysis } from '../types/single'

export function computeSingleSummary(
  basic: MatchBasicInfo,
  participant: MatchParticipant,
  teamParticipants: MatchParticipant[],
  allParticipants: MatchParticipant[]
): SingleSummaryAnalysis {
  const teamMaxChampionDmg = Math.max(...teamParticipants.map((p) => p.totalDamageDealtToChampions))
  const teamMaxDmgTaken = Math.max(...teamParticipants.map((p) => p.totalDamageTaken))
  const teamMaxGold = Math.max(...teamParticipants.map((p) => p.goldEarned))
  const teamMaxCs = Math.max(...teamParticipants.map((p) => p.cs))
  const teamMaxTowerDmg = Math.max(...teamParticipants.map((p) => p.totalDamageToTowers))
  const teamMaxShieldedDmg = Math.max(
    ...teamParticipants.map((p) => p.totalDamageShieldedOnTeammates ?? 0)
  )
  const teamTotalChampionDmg = teamParticipants.reduce(
    (acc, p) => acc + p.totalDamageDealtToChampions,
    0
  )
  const teamTotalDmgTaken = teamParticipants.reduce((acc, p) => acc + p.totalDamageTaken, 0)
  const teamTotalGold = teamParticipants.reduce((acc, p) => acc + p.goldEarned, 0)
  const teamTotalCs = teamParticipants.reduce((acc, p) => acc + p.cs, 0)
  const teamTotalTowerDmg = teamParticipants.reduce((acc, p) => acc + p.totalDamageToTowers, 0)
  const teamTotalShieldedDmg = teamParticipants.reduce(
    (acc, p) => acc + (p.totalDamageShieldedOnTeammates ?? 0),
    0
  )
  const teamTotalKills = teamParticipants.reduce((acc, p) => acc + p.kills, 0)

  const maxChampionDmg = Math.max(...allParticipants.map((p) => p.totalDamageDealtToChampions))
  const maxDmgTaken = Math.max(...allParticipants.map((p) => p.totalDamageTaken))
  const maxGold = Math.max(...allParticipants.map((p) => p.goldEarned))
  const maxCs = Math.max(...allParticipants.map((p) => p.cs))
  const maxTowerDmg = Math.max(...allParticipants.map((p) => p.totalDamageToTowers))
  const maxShieldedDmg = Math.max(
    ...allParticipants.map((p) => p.totalDamageShieldedOnTeammates ?? 0)
  )

  return {
    championDamageRatioToTeamMax:
      participant.totalDamageDealtToChampions / noZero(teamMaxChampionDmg),
    championDamageRatioToMax: participant.totalDamageDealtToChampions / noZero(maxChampionDmg),
    championDamagePercentageOfTeam:
      participant.totalDamageDealtToChampions / noZero(teamTotalChampionDmg),
    championDamagePerMinute: participant.totalDamageDealtToChampions / (basic.gameDuration / 60),
    damageTakenRatioToTeamMax: participant.totalDamageTaken / noZero(teamMaxDmgTaken),
    damageTakenRatioToMax: participant.totalDamageTaken / noZero(maxDmgTaken),
    damageTakenPercentageOfTeam: participant.totalDamageTaken / noZero(teamTotalDmgTaken),
    goldRatioToTeamMax: participant.goldEarned / noZero(teamMaxGold),
    goldRatioToMax: participant.goldEarned / noZero(maxGold),
    goldPercentageOfTeam: participant.goldEarned / noZero(teamTotalGold),
    csRatioToTeamMax: participant.cs / noZero(teamMaxCs),
    csRatioToMax: participant.cs / noZero(maxCs),
    csPercentageOfTeam: participant.cs / noZero(teamTotalCs),
    csPerMinute: participant.cs / (basic.gameDuration / 60),
    towerDamageRatioToTeamMax: participant.totalDamageToTowers / noZero(teamMaxTowerDmg),
    towerDamageRatioToMax: participant.totalDamageToTowers / noZero(maxTowerDmg),
    towerDamagePercentageOfTeam: participant.totalDamageToTowers / noZero(teamTotalTowerDmg),
    totalDamageShieldedOnTeammatesRatioToTeamMax:
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates / noZero(teamMaxShieldedDmg)
        : null,
    totalDamageShieldedOnTeammatesRatioToMax:
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates / noZero(maxShieldedDmg)
        : null,
    totalDamageShieldedOnTeammatesPercentageOfTeam:
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates / noZero(teamTotalShieldedDmg)
        : null,
    kda: participant.kda,
    win: participant.winResult === 'win',
    killParticipation: (participant.kills + participant.assists) / noZero(teamTotalKills),
    damageGoldEfficiency: participant.totalDamageDealtToChampions / noZero(participant.goldEarned),
    killDamageEfficiency:
      teamTotalKills === 0 || teamTotalChampionDmg === 0
        ? 1
        : participant.kills /
          teamTotalKills /
          (participant.totalDamageDealtToChampions / noZero(teamTotalChampionDmg))
  }
}
