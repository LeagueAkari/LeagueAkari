import { Team } from '@shared/types/league-client/match-history'

import { LcuOrSgpGameSummary } from '../wrapper'
import {
  AggregateTeamStats,
  MatchBasicInfo,
  MatchParticipant,
  MatchTeamInfo,
  MatchTeamStats,
  TeamsAdapterResult
} from './types'
import { computeWinResult } from './win-result'

// 截至至 2025-11-08 部分数据映射关系
function mapLcuToObjectives(team: Team): MatchTeamInfo {
  return {
    bans: team.bans,
    win: team.win,
    teamId: team.teamId,
    objectives: {
      atakhan: null,
      baron: {
        first: team.firstBaron,
        kills: team.baronKills
      },
      champion: null,
      dragon: {
        first: team.firstDargon,
        kills: team.dragonKills
      },
      horde: {
        first: null,
        kills: team.hordeKills
      },
      inhibitor: {
        first: team.firstInhibitor,
        kills: team.inhibitorKills
      },
      riftHerald: {
        first: null,
        kills: team.riftHeraldKills
      },
      tower: {
        first: team.firstTower,
        kills: team.towerKills
      }
    }
  }
}

function getTeamInfo(summary: LcuOrSgpGameSummary): MatchTeamInfo[] {
  if (summary.source === 'sgp') {
    const teams = summary.data.json.teams

    return teams.map((t) => {
      return {
        bans: t.bans,
        win: t.win,
        teamId: t.teamId,
        objectives: t.objectives
      }
    })
  }

  return summary.data.teams.map(mapLcuToObjectives)
}

export function toTeams(
  summary: LcuOrSgpGameSummary,
  basicInfo: MatchBasicInfo,
  participants: MatchParticipant[]
): TeamsAdapterResult {
  const teamsInfo = getTeamInfo(summary)

  // 按 teamIdentifier 分组
  const grouped = participants.reduce(
    (acc, p) => {
      acc[p.teamIdentifier] = acc[p.teamIdentifier] || []
      acc[p.teamIdentifier].push(p)
      return acc
    },
    {} as Record<string, MatchParticipant[]>
  )

  // 不计算 cherry team
  const primitiveTeamInfoMap = teamsInfo.reduce<Record<string, MatchTeamInfo>>((acc, teamInfo) => {
    acc[`TEAM-${teamInfo.teamId}`] = teamInfo
    return acc
  }, {})

  // 计算每个团队的统计数据
  const teamStatsArr: MatchTeamStats[] = Object.entries(grouped).map(
    ([teamIdentifier, teamParticipants]) => {
      const { isSurrender, result } = computeWinResult(
        basicInfo.endOfGameResult,
        teamParticipants[0]
      )

      return {
        teamIdentifier,
        teamInfo: primitiveTeamInfoMap[teamIdentifier] ?? (null as MatchTeamInfo | null),
        winResult: result,
        isSurrender,
        win: teamParticipants[0].win,
        subteamPlacement: teamParticipants[0].subteamPlacement,
        maxDamageDealtToChampions: Math.max(
          ...teamParticipants.map((p) => p.totalDamageDealtToChampions)
        ),
        totalDamageDealtToChampions: teamParticipants.reduce(
          (acc, p) => acc + p.totalDamageDealtToChampions,
          0
        ),
        maxDamageTaken: Math.max(...teamParticipants.map((p) => p.totalDamageTaken)),
        totalDamageTaken: teamParticipants.reduce((acc, p) => acc + p.totalDamageTaken, 0),
        maxGoldEarned: Math.max(...teamParticipants.map((p) => p.goldEarned)),
        totalGoldEarned: teamParticipants.reduce((acc, p) => acc + p.goldEarned, 0),
        maxKills: Math.max(...teamParticipants.map((p) => p.kills)),
        totalKills: teamParticipants.reduce((acc, p) => acc + p.kills, 0),
        totalDeaths: teamParticipants.reduce((acc, p) => acc + p.deaths, 0),
        totalAssists: teamParticipants.reduce((acc, p) => acc + p.assists, 0),
        maxCs: Math.max(...teamParticipants.map((p) => p.cs)),
        totalCs: teamParticipants.reduce((acc, p) => acc + p.cs, 0),
        maxDamageToTowers: Math.max(...teamParticipants.map((p) => p.totalDamageToTowers)),
        totalDamageToTowers: teamParticipants.reduce((acc, p) => acc + p.totalDamageToTowers, 0),
        maxHeal: Math.max(...teamParticipants.map((p) => p.totalHeal)),
        totalHeal: teamParticipants.reduce((acc, p) => acc + p.totalHeal, 0),
        maxKda: Math.max(...teamParticipants.map((p) => p.kda)),
        totalKda: teamParticipants.reduce((acc, p) => acc + p.kda, 0),
        maxKillParticipation: Math.max(...teamParticipants.map((p) => p.killParticipation)),
        totalKillParticipation: teamParticipants.reduce((acc, p) => acc + p.killParticipation, 0),
        maxDamageShieldedOnTeammates:
          teamParticipants[0].totalDamageShieldedOnTeammates !== null
            ? Math.max(...teamParticipants.map((p) => p.totalDamageShieldedOnTeammates ?? 0))
            : null,
        totalDamageShieldedOnTeammates:
          teamParticipants[0].totalDamageShieldedOnTeammates !== null
            ? teamParticipants.reduce((acc, p) => acc + (p.totalDamageShieldedOnTeammates ?? 0), 0)
            : null
      }
    }
  )

  const allTeamStats: AggregateTeamStats = {
    teamIdentifier: 'ALL',
    bans: Object.values(primitiveTeamInfoMap).flatMap((team) => team.bans),
    maxDamageDealtToChampions: Math.max(...teamStatsArr.map((t) => t.maxDamageDealtToChampions)),
    totalDamageDealtToChampions: teamStatsArr.reduce(
      (acc, t) => acc + t.totalDamageDealtToChampions,
      0
    ),
    maxDamageTaken: Math.max(...teamStatsArr.map((t) => t.maxDamageTaken)),
    totalDamageTaken: teamStatsArr.reduce((acc, t) => acc + t.totalDamageTaken, 0),
    maxGoldEarned: Math.max(...teamStatsArr.map((t) => t.maxGoldEarned)),
    totalGoldEarned: teamStatsArr.reduce((acc, t) => acc + t.totalGoldEarned, 0),
    maxKills: Math.max(...teamStatsArr.map((t) => t.maxKills)),
    totalKills: teamStatsArr.reduce((acc, t) => acc + t.totalKills, 0),
    totalDeaths: teamStatsArr.reduce((acc, t) => acc + t.totalDeaths, 0),
    totalAssists: teamStatsArr.reduce((acc, t) => acc + t.totalAssists, 0),
    maxCs: Math.max(...teamStatsArr.map((t) => t.maxCs)),
    totalCs: teamStatsArr.reduce((acc, t) => acc + t.totalCs, 0),
    maxDamageToTowers: Math.max(...teamStatsArr.map((t) => t.maxDamageToTowers)),
    totalDamageToTowers: teamStatsArr.reduce((acc, t) => acc + t.totalDamageToTowers, 0),
    maxHeal: Math.max(...teamStatsArr.map((t) => t.maxHeal)),
    totalHeal: teamStatsArr.reduce((acc, t) => acc + t.totalHeal, 0),
    maxKda: Math.max(...teamStatsArr.map((t) => t.maxKda)),
    totalKda: teamStatsArr.reduce((acc, t) => acc + t.totalKda, 0),
    maxKillParticipation: Math.max(...teamStatsArr.map((t) => t.maxKillParticipation)),
    totalKillParticipation: teamStatsArr.reduce((acc, t) => acc + t.totalKillParticipation, 0),
    maxDamageShieldedOnTeammates:
      teamStatsArr[0].maxDamageShieldedOnTeammates !== null
        ? Math.max(...teamStatsArr.map((t) => t.maxDamageShieldedOnTeammates ?? 0))
        : null,
    totalDamageShieldedOnTeammates:
      teamStatsArr[0].totalDamageShieldedOnTeammates !== null
        ? teamStatsArr.reduce((acc, t) => acc + (t.totalDamageShieldedOnTeammates ?? 0), 0)
        : null
  }

  // 转换为 Map 结构便于查询
  const teamStatMap = teamStatsArr.reduce<Record<string, MatchTeamStats>>((acc, teamStats) => {
    acc[teamStats.teamIdentifier] = teamStats
    return acc
  }, {})

  return {
    teamStatMap,
    teamStatsArr,
    allTeamStats
  }
}
