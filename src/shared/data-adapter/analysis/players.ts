import { isPveQueue } from '@shared/types/league-client/match-history'

import { toBasicInfo } from '../match-history/match-basic'
import { toParticipants } from '../match-history/participants'
import { toTeams } from '../match-history/teams'
import { calculateCoefficientOfVariation, noZero } from '../utils'
import { LcuOrSgpGameSummary } from '../wrapper'

const SUMMONER_SPELL_FLASH_ID = 4

export interface MatchHistoryGamesAnalysis {
  gameId: number

  championId: number
  winResult: string

  // 比率字段（精简版）
  championDamageRatioToTeamMax: number
  championDamageRatioToMax: number
  championDamagePercentageOfTeam: number
  damageTakenRatioToTeamMax: number
  damageTakenRatioToMax: number
  damageTakenPercentageOfTeam: number
  goldRatioToTeamMax: number
  goldRatioToMax: number
  goldPercentageOfTeam: number
  csRatioToTeamMax: number
  csRatioToMax: number
  csPercentageOfTeam: number
  csPerMinute: number
  towerDamageRatioToTeamMax: number
  towerDamageRatioToMax: number
  towerDamagePercentageOfTeam: number
  totalDamageShieldedOnTeammatesRatioToTeamMax: number | null
  totalDamageShieldedOnTeammatesRatioToMax: number | null
  totalDamageShieldedOnTeammatesPercentageOfTeam: number | null

  visionScore: number

  // KDA 系列
  kills: number
  deaths: number
  assists: number
  kda: number
  killParticipation: number
  damageGoldEfficiency: number

  // solo kills is shown only in sgp
  soloKills: number | null

  // 召唤师技能
  flashOnD: boolean
  flashOnF: boolean

  // 游戏模式
  isCherryMode: boolean
  subteamPlacement: number
}

export interface MatchHistoryChampionAnalysis {
  id: number
  count: number
  wins: number
  losses: number
  winRate: number

  normal: {
    count: number
    wins: number
    losses: number
    winRate: number
  }

  cherry: {
    count: number
    wins: number
    losses: number
    first: number
    winRate: number
  }
}

export interface MatchHistoryGamesAnalysisSummary {
  redSideCount: number
  blueSideCount: number
  count: number

  avgChampionDamageRatioToTeamMax: number
  avgChampionDamageRatioToMax: number
  avgChampionDamagePercentageOfTeam: number
  avgDamageTakenRatioToTeamMax: number
  avgDamageTakenRatioToMax: number
  avgDamageTakenPercentageOfTeam: number
  avgGoldRatioToTeamMax: number
  avgGoldRatioToMax: number
  avgGoldPercentageOfTeam: number
  avgCsRatioToTeamMax: number
  avgCsRatioToMax: number
  avgCsPercentageOfTeam: number
  avgCsPerMinute: number
  avgTowerDamageRatioToTeamMax: number
  avgTowerDamageRatioToMax: number
  avgTowerDamagePercentageOfTeam: number

  avgVisionScore: number

  kills: number
  deaths: number
  assists: number

  avgKda: number
  kdaCv: number
  avgKillParticipation: number
  avgDamageGoldEfficiency: number

  wins: number
  losses: number
  winRate: number

  winningStreak: number
  losingStreak: number

  flashOnD: number
  flashOnF: number

  avgSubteamPlacement: number

  // cherry only
  cherry: {
    count: number
    top1s: number
    top4s: number
    winRate: number
    top1Rate: number
  }

  // --- sgp only ---
  avgEnemyMissingPings: number | null
  avgPings: number | null
  avgSoloKills: number | null
}

export interface MatchHistoryChampionPositionAnalysis {
  TOP: number
  JUNGLE: number
  MIDDLE: number
  BOTTOM: number
  UTILITY: number
}

export interface AkariScore {
  kdaScore: number
  winRateScore: number
  dmgScore: number
  dmgTakenScore: number
  csScore: number
  goldScore: number
  participationScore: number
  total: number
  outstanding: boolean
  extraordinary: boolean
}

export interface MatchHistoryGamesAnalysisAll {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
  champions: Record<number, MatchHistoryChampionAnalysis>
  akariScore: AkariScore
  positions: MatchHistoryChampionPositionAnalysis | null
}

// 非卖品, 仅限内部评判使用
export function calculateAkariScore(analysis: {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
  champions: Record<number, MatchHistoryChampionAnalysis>
}): AkariScore {
  const kdaScore = Math.sqrt(analysis.summary.avgKda) * 1.44
  const winRateScore = (analysis.summary.winRate - 0.5) * 4
  const dmgScore = analysis.summary.avgChampionDamageRatioToTeamMax * 10.0
  const dmgTakenScore = analysis.summary.avgDamageTakenRatioToTeamMax * 8.0
  const csScore =
    analysis.summary.avgCsPerMinute *
    Math.max(Math.min(0.04 * analysis.summary.avgCsPerMinute, 0.4), 0.1)
  const goldScore = analysis.summary.avgGoldRatioToTeamMax * 4.0
  const participationScore = analysis.summary.avgKillParticipation * 4

  const total =
    kdaScore + winRateScore + dmgScore + dmgTakenScore + csScore + goldScore + participationScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    csScore,
    goldScore,
    participationScore,
    total,
    outstanding: total >= 26.0 && analysis.summary.count >= 5,
    extraordinary: total >= 30.0 && analysis.summary.count >= 8
  }
}

/**
 * 简易封装拆分
 */
function toUnifiedGames(games: LcuOrSgpGameSummary[], puuid: string) {
  return games
    .map((g) => {
      const basicInfo = toBasicInfo(g)
      const participants = toParticipants(g, basicInfo)
      const teams = toTeams(g, basicInfo, participants)
      const participant = participants.find((p) => p.puuid === puuid)
      if (!participant) return null
      const team = teams.teamStatMap[participant.teamIdentifier]
      return { basicInfo, participants, teams, team, participant }
    })
    .filter((g) => g !== null)
}

export function analyzeMatchHistory(
  games: LcuOrSgpGameSummary[],
  puuid: string
): MatchHistoryGamesAnalysisAll | null {
  const unified = toUnifiedGames(games, puuid)

  // 过滤异常数据和重开数据，后面可以直接断言非空
  const filteredGames = unified.filter(({ participant, basicInfo }) => {
    if (isPveQueue(basicInfo.queueId)) {
      return false
    }

    if (basicInfo.gameType !== 'MATCHED_GAME') {
      return false
    }

    return participant.winResult !== 'remake' && participant.winResult !== 'abort'
  })

  if (filteredGames.length === 0) return null

  // --- games analysis ---

  const gamesAnalysis: MatchHistoryGamesAnalysis[] = []

  for (const {
    basicInfo: { gameMode, gameId, gameDuration },
    participant,
    team,
    teams
  } of filteredGames) {
    const championDamageRatioToTeamMax =
      participant.totalDamageDealtToChampions / noZero(team.maxDamageDealtToChampions)
    const championDamageRatioToMax =
      participant.totalDamageDealtToChampions / noZero(teams.allTeamStats.maxDamageDealtToChampions)
    const championDamagePercentageOfTeam =
      participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)

    const damageTakenRatioToTeamMax = participant.totalDamageTaken / noZero(team.maxDamageTaken)
    const damageTakenRatioToMax =
      participant.totalDamageTaken / noZero(teams.allTeamStats.maxDamageTaken)
    const damageTakenPercentageOfTeam = participant.totalDamageTaken / noZero(team.totalDamageTaken)

    const goldRatioToTeamMax = participant.goldEarned / noZero(team.maxGoldEarned)
    const goldRatioToMax = participant.goldEarned / noZero(teams.allTeamStats.maxGoldEarned)
    const goldPercentageOfTeam = participant.goldEarned / noZero(team.totalGoldEarned)

    const csRatioToTeamMax = participant.cs / noZero(team.maxCs)
    const csRatioToMax = participant.cs / noZero(teams.allTeamStats.maxCs)
    const csPercentageOfTeam = participant.cs / noZero(team.totalCs)

    const towerDamageRatioToTeamMax =
      participant.totalDamageToTowers / noZero(team.maxDamageToTowers)
    const towerDamageRatioToMax =
      participant.totalDamageToTowers / noZero(teams.allTeamStats.maxDamageToTowers)
    const towerDamagePercentageOfTeam =
      participant.totalDamageToTowers / noZero(team.totalDamageToTowers)

    // sgp only
    const totalDamageShieldedOnTeammatesRatioToTeamMax =
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates /
          noZero(team.maxDamageShieldedOnTeammates ?? 0)
        : null
    const totalDamageShieldedOnTeammatesRatioToMax =
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates /
          noZero(teams.allTeamStats.maxDamageShieldedOnTeammates ?? 0)
        : null
    const totalDamageShieldedOnTeammatesPercentageOfTeam =
      participant.totalDamageShieldedOnTeammates !== null
        ? participant.totalDamageShieldedOnTeammates /
          noZero(team.totalDamageShieldedOnTeammates ?? 0)
        : null

    gamesAnalysis.push({
      gameId,

      championId: participant.championId,
      winResult: participant.winResult,

      championDamageRatioToTeamMax,
      championDamageRatioToMax,
      championDamagePercentageOfTeam,
      damageTakenRatioToTeamMax,
      damageTakenRatioToMax,
      damageTakenPercentageOfTeam,
      goldRatioToTeamMax,
      goldRatioToMax,
      goldPercentageOfTeam,
      csRatioToTeamMax,
      csRatioToMax,
      csPercentageOfTeam,
      csPerMinute: participant.cs / (gameDuration / 60),
      towerDamageRatioToTeamMax,
      towerDamagePercentageOfTeam,
      towerDamageRatioToMax,

      totalDamageShieldedOnTeammatesRatioToTeamMax,
      totalDamageShieldedOnTeammatesRatioToMax,
      totalDamageShieldedOnTeammatesPercentageOfTeam,

      visionScore: participant.visionScore,

      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda: participant.kda,
      killParticipation: (participant.kills + participant.assists) / noZero(team.totalKills),
      damageGoldEfficiency:
        participant.totalDamageDealtToChampions / noZero(participant.goldEarned),

      soloKills: participant.soloKills,

      flashOnD: participant.spells[0] === SUMMONER_SPELL_FLASH_ID,
      flashOnF: participant.spells[1] === SUMMONER_SPELL_FLASH_ID,

      isCherryMode: gameMode === 'CHERRY',
      subteamPlacement: participant.subteamPlacement
    })
  }

  // --- champions analysis ---

  const championAnalysis: Record<number, MatchHistoryChampionAnalysis> = {}

  for (const { participant, basicInfo } of filteredGames) {
    if (!championAnalysis[participant.championId]) {
      championAnalysis[participant.championId] = {
        id: participant.championId,
        count: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        normal: { count: 0, wins: 0, losses: 0, winRate: 0 },
        cherry: { count: 0, wins: 0, losses: 0, first: 0, winRate: 0 }
      }
    }

    championAnalysis[participant.championId].count++

    if (basicInfo.gameMode === 'CHERRY') {
      championAnalysis[participant.championId].cherry.count++

      if (participant.winResult === 'win') {
        championAnalysis[participant.championId].cherry.wins++
      } else {
        championAnalysis[participant.championId].cherry.losses++
      }

      if (participant.subteamPlacement === 1) {
        championAnalysis[participant.championId].cherry.first++
      }
    } else {
      championAnalysis[participant.championId].normal.count++

      if (participant.winResult === 'win') {
        championAnalysis[participant.championId].normal.wins++
      } else if (participant.winResult === 'lose') {
        championAnalysis[participant.championId].normal.losses++
      }
    }
  }

  // aggregate win rate
  for (const champion in championAnalysis) {
    championAnalysis[champion].wins += championAnalysis[champion].normal.wins
    championAnalysis[champion].wins += championAnalysis[champion].cherry.wins
    championAnalysis[champion].losses += championAnalysis[champion].normal.losses
    championAnalysis[champion].losses += championAnalysis[champion].cherry.losses
    championAnalysis[champion].winRate =
      championAnalysis[champion].wins /
      (championAnalysis[champion].wins + championAnalysis[champion].losses)
    championAnalysis[champion].normal.winRate =
      championAnalysis[champion].normal.wins /
      (championAnalysis[champion].normal.wins + championAnalysis[champion].normal.losses)
    championAnalysis[champion].cherry.winRate =
      championAnalysis[champion].cherry.wins /
      (championAnalysis[champion].cherry.wins + championAnalysis[champion].cherry.losses)
  }

  // --- 连胜 / 连败 ---

  const winResults = filteredGames.map((g) => g.participant.winResult)

  // 连胜统计
  let winningStreak = 0
  let losingStreak = 0

  for (const result of winResults) {
    if (result === 'win') {
      if (losingStreak > 0) {
        break
      }
      winningStreak += 1
      continue
    }

    if (winningStreak > 0) {
      break
    }

    losingStreak += 1
  }

  // --- positions sgp only ---

  let positions: {
    TOP: number
    JUNGLE: number
    MIDDLE: number
    BOTTOM: number
    UTILITY: number
  } | null = null

  if (filteredGames[0].participant.position) {
    positions = { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: 0 }

    for (const { participant } of filteredGames) {
      if (participant.position) {
        positions[participant.position] = (positions[participant.position] || 0) + 1
      }
    }
  }

  // --- summary aggregation ---

  const kills = gamesAnalysis.reduce((sum, { kills }) => sum + kills, 0)
  const deaths = gamesAnalysis.reduce((sum, { deaths }) => sum + deaths, 0)
  const assists = gamesAnalysis.reduce((sum, { assists }) => sum + assists, 0)
  const wins = filteredGames.reduce(
    (sum, { participant }) => sum + (participant.winResult === 'win' ? 1 : 0),
    0
  )
  const losses = gamesAnalysis.length - wins

  const cherryAnalysisList = gamesAnalysis.filter(({ isCherryMode }) => isCherryMode)
  const cherryTop1s = cherryAnalysisList.reduce(
    (sum, { subteamPlacement }) => sum + (subteamPlacement === 1 ? 1 : 0),
    0
  )
  const cherryTop4s = cherryAnalysisList.reduce(
    (sum, { subteamPlacement }) => sum + (subteamPlacement <= 4 ? 1 : 0),
    0
  )
  const cherryWins = cherryAnalysisList.reduce(
    (sum, { winResult }) => sum + (winResult === 'win' ? 1 : 0),
    0
  )

  const summary: MatchHistoryGamesAnalysisSummary = {
    count: gamesAnalysis.length,

    redSideCount: filteredGames.reduce(
      (sum, { participant }) => (participant.teamIdentifier === 'TEAM-100' ? sum + 1 : sum),
      0
    ),
    blueSideCount: filteredGames.reduce(
      (sum, { participant }) => (participant.teamIdentifier === 'TEAM-200' ? sum + 1 : sum),
      0
    ),

    avgChampionDamageRatioToTeamMax:
      gamesAnalysis.reduce(
        (sum, { championDamageRatioToTeamMax }) => sum + championDamageRatioToTeamMax,
        0
      ) / noZero(gamesAnalysis.length),
    avgChampionDamageRatioToMax:
      gamesAnalysis.reduce(
        (sum, { championDamageRatioToMax }) => sum + championDamageRatioToMax,
        0
      ) / noZero(gamesAnalysis.length),
    avgChampionDamagePercentageOfTeam:
      gamesAnalysis.reduce(
        (sum, { championDamagePercentageOfTeam }) => sum + championDamagePercentageOfTeam,
        0
      ) / noZero(gamesAnalysis.length),
    avgDamageTakenRatioToTeamMax:
      gamesAnalysis.reduce(
        (sum, { damageTakenRatioToTeamMax }) => sum + damageTakenRatioToTeamMax,
        0
      ) / noZero(gamesAnalysis.length),
    avgDamageTakenRatioToMax:
      gamesAnalysis.reduce((sum, { damageTakenRatioToMax }) => sum + damageTakenRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgDamageTakenPercentageOfTeam:
      gamesAnalysis.reduce(
        (sum, { damageTakenPercentageOfTeam }) => sum + damageTakenPercentageOfTeam,
        0
      ) / noZero(gamesAnalysis.length),
    avgGoldRatioToTeamMax:
      gamesAnalysis.reduce((sum, { goldRatioToTeamMax }) => sum + goldRatioToTeamMax, 0) /
      noZero(gamesAnalysis.length),
    avgGoldRatioToMax:
      gamesAnalysis.reduce((sum, { goldRatioToMax }) => sum + goldRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgGoldPercentageOfTeam:
      gamesAnalysis.reduce((sum, { goldPercentageOfTeam }) => sum + goldPercentageOfTeam, 0) /
      noZero(gamesAnalysis.length),
    avgCsRatioToTeamMax:
      gamesAnalysis.reduce((sum, { csRatioToTeamMax }) => sum + csRatioToTeamMax, 0) /
      noZero(gamesAnalysis.length),
    avgCsRatioToMax:
      gamesAnalysis.reduce((sum, { csRatioToMax }) => sum + csRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgCsPercentageOfTeam:
      gamesAnalysis.reduce((sum, { csPercentageOfTeam }) => sum + csPercentageOfTeam, 0) /
      noZero(gamesAnalysis.length),
    avgCsPerMinute:
      gamesAnalysis.reduce((sum, { csPerMinute }) => sum + csPerMinute, 0) /
      noZero(gamesAnalysis.length),
    avgTowerDamageRatioToTeamMax:
      gamesAnalysis.reduce(
        (sum, { towerDamageRatioToTeamMax }) => sum + towerDamageRatioToTeamMax,
        0
      ) / noZero(gamesAnalysis.length),
    avgTowerDamageRatioToMax:
      gamesAnalysis.reduce((sum, { towerDamageRatioToMax }) => sum + towerDamageRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgTowerDamagePercentageOfTeam:
      gamesAnalysis.reduce(
        (sum, { towerDamagePercentageOfTeam }) => sum + towerDamagePercentageOfTeam,
        0
      ) / noZero(gamesAnalysis.length),

    avgVisionScore:
      gamesAnalysis.reduce((sum, { visionScore }) => sum + visionScore, 0) /
      noZero(gamesAnalysis.length),

    wins,
    losses,
    winRate: wins / noZero(gamesAnalysis.length),

    winningStreak,
    losingStreak,

    assists,
    deaths,
    kills,
    avgKillParticipation:
      gamesAnalysis.reduce((sum, { killParticipation }) => sum + killParticipation, 0) /
      noZero(gamesAnalysis.length),
    avgDamageGoldEfficiency:
      gamesAnalysis.reduce((sum, { damageGoldEfficiency }) => sum + damageGoldEfficiency, 0) /
      noZero(gamesAnalysis.length),

    avgKda: (kills + assists) / noZero(deaths),
    kdaCv: calculateCoefficientOfVariation(gamesAnalysis.map(({ kda }) => kda)),

    flashOnD: gamesAnalysis.reduce((sum, { flashOnD }) => sum + (flashOnD ? 1 : 0), 0),
    flashOnF: gamesAnalysis.reduce((sum, { flashOnF }) => sum + (flashOnF ? 1 : 0), 0),

    avgSubteamPlacement:
      gamesAnalysis.reduce((sum, { subteamPlacement }) => sum + subteamPlacement, 0) /
      noZero(gamesAnalysis.length),

    cherry: {
      count: cherryAnalysisList.length,
      top1s: cherryTop1s,
      top4s: cherryTop4s,
      winRate: cherryWins / noZero(cherryAnalysisList.length),
      top1Rate: cherryTop1s / noZero(cherryAnalysisList.length)
    },

    avgEnemyMissingPings: null, // be assigned later
    avgPings: null, // be assigned later
    avgSoloKills: null // be assigned later
  }

  // --- pings sgo only ---

  if (filteredGames[0].participant.pings) {
    const pings = filteredGames.reduce(
      (sum, { participant }) => {
        if (participant.pings) {
          sum.enemyMissingPings += participant.pings.enemyMissingPings || 0
          sum.allPings +=
            participant.pings.allInPings +
            participant.pings.assistMePings +
            participant.pings.basicPings +
            participant.pings.commandPings +
            participant.pings.dangerPings +
            participant.pings.enemyVisionPings +
            participant.pings.getBackPings +
            participant.pings.holdPings +
            participant.pings.needVisionPings +
            participant.pings.onMyWayPings +
            participant.pings.pushPings +
            participant.pings.retreatPings +
            participant.pings.visionClearedPings
        }
        return sum
      },
      { enemyMissingPings: 0, allPings: 0 }
    )

    summary.avgEnemyMissingPings = pings.enemyMissingPings / noZero(gamesAnalysis.length)
    summary.avgPings = pings.allPings / noZero(gamesAnalysis.length)
  }

  // --- solo kills sgp only ---

  if (filteredGames[0].participant.soloKills) {
    summary.avgSoloKills =
      filteredGames.reduce((sum, { participant }) => sum + (participant.soloKills || 0), 0) /
      noZero(filteredGames.length)
  }

  const gameDict = gamesAnalysis.reduce(
    (acc, game) => {
      acc[game.gameId] = game
      return acc
    },
    {} as Record<number, MatchHistoryGamesAnalysis>
  )

  return {
    games: gameDict,
    summary,
    champions: championAnalysis,
    akariScore: calculateAkariScore({ games: gameDict, summary, champions: championAnalysis }),
    positions
  }
}
