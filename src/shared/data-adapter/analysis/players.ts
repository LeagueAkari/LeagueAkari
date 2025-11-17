import { toBasicInfo } from '../match-history/match-basic'
import { toParticipants } from '../match-history/participants'
import { toTeams } from '../match-history/teams'
import { LcuOrSgpMatchHistory } from '../wrapper'
import { calculateCoefficientOfVariation, noZero } from './utils'

const SUMMONER_SPELL_FLASH_ID = 4

export interface MatchHistoryGamesAnalysis {
  gameId: number

  // 比率字段（精简版）
  championDamageRatioToTeamMax: number
  championDamageRatioToMax: number
  damageTakenRatioToTeamMax: number
  damageTakenRatioToMax: number
  goldRatioToTeamMax: number
  goldRatioToMax: number
  csRatioToTeamMax: number
  csRatioToMax: number
  csPerMinute: number
  towerDamageRatioToTeamMax: number
  towerDamageRatioToMax: number

  // KDA 系列
  kills: number
  deaths: number
  assists: number
  kda: number
  killParticipation: number

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
  loses: number
  winRate: number

  normal: {
    count: number
    wins: number
    loses: number
    winRate: number
  }

  cherry: {
    count: number
    wins: number
    loses: number
    first: number
    winRate: number
  }
}

export interface MatchHistoryGamesAnalysisSummary {
  count: number

  avgChampionDamageRatioToTeamMax: number
  avgChampionDamageRatioToMax: number
  avgDamageTakenRatioToTeamMax: number
  avgDamageTakenRatioToMax: number
  avgGoldRatioToTeamMax: number
  avgGoldRatioToMax: number
  avgCsRatioToTeamMax: number
  avgCsRatioToMax: number
  avgCsPerMinute: number
  avgTowerDamageRatioToTeamMax: number
  avgTowerDamageRatioToMax: number

  kills: number
  deaths: number
  assists: number

  avgKda: number
  kdaCv: number
  avgKillParticipation: number

  wins: number
  loses: number
  winRate: number

  winningStreak: number
  losingStreak: number

  flashOnD: number
  flashOnF: number

  avgSubteamPlacement: number

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
function toUnifiedGames(history: LcuOrSgpMatchHistory, puuid: string) {
  const { source, data } = history

  if (source === 'sgp') {
    return data.games
      .filter((g) => g.json)
      .map((g) => {
        const basicInfo = toBasicInfo({ source, data: g })
        const participants = toParticipants({ source, data: g }, basicInfo)
        const teams = toTeams({ source, data: g }, basicInfo, participants)
        const participant = participants.find((p) => p.puuid === puuid)
        if (!participant) return null
        const team = teams.teamStatMap[participant.teamIdentifier]
        return { basicInfo, participants, teams, team, participant }
      })
      .filter((g) => g !== null)
  } else {
    return data.games.games
      .map((g) => {
        const basicInfo = toBasicInfo({ source, data: g })
        const participants = toParticipants({ source, data: g }, basicInfo)
        const teams = toTeams({ source, data: g }, basicInfo, participants)
        const participant = participants.find((p) => p.puuid === puuid)
        if (!participant) return null
        const team = teams.teamStatMap[participant.teamIdentifier]
        return { basicInfo, participants, teams, team, participant }
      })
      .filter((g) => g !== null)
  }
}

export function analyzeMatchHistory(
  history: LcuOrSgpMatchHistory,
  puuid: string
): MatchHistoryGamesAnalysisAll | null {
  const games = toUnifiedGames(history, puuid)

  // 过滤异常数据和重开数据，后面可以直接断言非空
  const filteredGames = games.filter(({ team }) => {
    return team.winResult !== 'remake' && team.winResult !== 'abort'
  })

  if (filteredGames.length === 0) return null

  // --- games analysis ---

  const gamesAnalysis: MatchHistoryGamesAnalysis[] = []

  for (const {
    basicInfo: { gameMode, gameId, gameDuration },
    participant,
    team
  } of filteredGames) {
    const championDamageRatioToTeamMax =
      participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)
    const championDamageRatioToMax =
      participant.totalDamageDealtToChampions / noZero(team.maxDamageDealtToChampions)
    const damageTakenRatioToTeamMax = participant.totalDamageTaken / noZero(team.totalDamageTaken)
    const damageTakenRatioToMax = participant.totalDamageTaken / noZero(team.maxDamageTaken)
    const goldRatioToTeamMax = participant.goldEarned / noZero(team.totalGoldEarned)
    const goldRatioToMax = participant.goldEarned / noZero(team.maxGoldEarned)
    const csRatioToTeamMax = participant.cs / noZero(team.totalCs)
    const csRatioToMax = participant.cs / noZero(team.maxCs)
    const towerDamageRatioToTeamMax =
      participant.totalDamageToTowers / noZero(team.totalDamageToTowers)
    const towerDamageRatioToMax = participant.totalDamageToTowers / noZero(team.maxDamageToTowers)

    gamesAnalysis.push({
      gameId,

      championDamageRatioToTeamMax,
      championDamageRatioToMax,
      damageTakenRatioToTeamMax,
      damageTakenRatioToMax,
      goldRatioToTeamMax,
      goldRatioToMax,
      csRatioToTeamMax,
      csRatioToMax,
      csPerMinute: participant.cs / (gameDuration / 60),
      towerDamageRatioToTeamMax,
      towerDamageRatioToMax,

      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda: participant.kda,
      killParticipation: (participant.kills + participant.assists) / noZero(team.totalKills),

      soloKills: participant.soloKills,

      flashOnD: participant.spells[0] === SUMMONER_SPELL_FLASH_ID,
      flashOnF: participant.spells[1] === SUMMONER_SPELL_FLASH_ID,

      isCherryMode: gameMode === 'CHERRY',
      subteamPlacement: participant.subteamPlacement
    })
  }

  // --- champions analysis ---

  const championAnalysis: Record<number, MatchHistoryChampionAnalysis> = {}

  for (const { participant, basicInfo, team } of filteredGames) {
    if (!championAnalysis[participant.championId]) {
      championAnalysis[participant.championId] = {
        id: participant.championId,
        count: 0,
        wins: 0,
        loses: 0,
        winRate: 0,
        normal: { count: 0, wins: 0, loses: 0, winRate: 0 },
        cherry: { count: 0, wins: 0, loses: 0, first: 0, winRate: 0 }
      }
    }

    championAnalysis[participant.championId].count++

    if (basicInfo.gameMode === 'CHERRY') {
      championAnalysis[participant.championId].cherry.count++

      if (team.winResult === 'win') {
        championAnalysis[participant.championId].cherry.wins++
      } else {
        championAnalysis[participant.championId].cherry.loses++
      }

      if (participant.subteamPlacement === 1) {
        championAnalysis[participant.championId].cherry.first++
      }
    } else {
      championAnalysis[participant.championId].normal.count++

      if (team.winResult === 'win') {
        championAnalysis[participant.championId].normal.wins++
      } else if (team.winResult === 'lose') {
        championAnalysis[participant.championId].normal.loses++
      }
    }
  }

  // --- 连胜 / 连败 ---

  const winResults = filteredGames.map((g) => g.team.winResult)

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
  const wins = filteredGames.reduce((sum, { team }) => sum + (team.winResult === 'win' ? 1 : 0), 0)
  const loses = gamesAnalysis.length - wins

  const summary: MatchHistoryGamesAnalysisSummary = {
    count: gamesAnalysis.length,

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
    avgDamageTakenRatioToTeamMax:
      gamesAnalysis.reduce(
        (sum, { damageTakenRatioToTeamMax }) => sum + damageTakenRatioToTeamMax,
        0
      ) / noZero(gamesAnalysis.length),
    avgDamageTakenRatioToMax:
      gamesAnalysis.reduce((sum, { damageTakenRatioToMax }) => sum + damageTakenRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgGoldRatioToTeamMax:
      gamesAnalysis.reduce((sum, { goldRatioToTeamMax }) => sum + goldRatioToTeamMax, 0) /
      noZero(gamesAnalysis.length),
    avgGoldRatioToMax:
      gamesAnalysis.reduce((sum, { goldRatioToMax }) => sum + goldRatioToMax, 0) /
      noZero(gamesAnalysis.length),
    avgCsRatioToTeamMax:
      gamesAnalysis.reduce((sum, { csRatioToTeamMax }) => sum + csRatioToTeamMax, 0) /
      noZero(gamesAnalysis.length),
    avgCsRatioToMax:
      gamesAnalysis.reduce((sum, { csRatioToMax }) => sum + csRatioToMax, 0) /
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

    wins,
    loses,
    winRate: wins / noZero(gamesAnalysis.length),

    winningStreak,
    losingStreak,

    assists,
    deaths,
    kills,
    avgKillParticipation:
      gamesAnalysis.reduce((sum, { killParticipation }) => sum + killParticipation, 0) /
      noZero(gamesAnalysis.length),

    avgKda: (kills + assists) / noZero(deaths),
    kdaCv: calculateCoefficientOfVariation(gamesAnalysis.map(({ kda }) => kda)),

    flashOnD: gamesAnalysis.reduce((sum, { flashOnD }) => sum + (flashOnD ? 1 : 0), 0),
    flashOnF: gamesAnalysis.reduce((sum, { flashOnF }) => sum + (flashOnF ? 1 : 0), 0),

    avgSubteamPlacement:
      gamesAnalysis.reduce((sum, { subteamPlacement }) => sum + subteamPlacement, 0) /
      noZero(gamesAnalysis.length),

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
