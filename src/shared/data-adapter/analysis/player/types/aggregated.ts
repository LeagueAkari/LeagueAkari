import type { AggregatedPositionAnalysis } from '../aggregate/positions'
import { GankPoint, JungleCamp, MinutePositionPoint } from './helpers'
import { AkariScore, SingleAnalysis, SingleDetailsAnalysis, SingleSummaryAnalysis } from './single'

export interface AggregatedSummaryAnalysis {
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
  avgDamageGoldEfficiency: number
  avgKillParticipation: number

  kills: number
  deaths: number
  assists: number
  avgKda: number
  kdaCv: number
  winRate: number

  // sgp only
  avgSoloKills: number | null
  avgEnemyMissingPings: number | null
  avgPings: number | null
}

export interface AggregatedSpellsAnalysis {
  flashOnD: number
  flashOnF: number
}

export interface AggregatedTeamSideAnalysis {
  redSideCount: number
  blueSideCount: number
}

export interface AggregatedWinLossAnalysis {
  count: number
  activeSessionWins: number
  activeSessionLosses: number
  wins: number
  losses: number
  winRate: number
  winningStreak: number
  losingStreak: number
}

export interface AggregatedCherryWinLossAnalysis extends AggregatedWinLossAnalysis {
  top1s: number
  topHalfFinishes: number
  top1Rate: number
  topHalfRate: number
  avgSubteamPlacement: number
}

export interface AggregatedWinLossAnalysisMap {
  all: AggregatedWinLossAnalysis
  normal: AggregatedWinLossAnalysis
  cherry: AggregatedCherryWinLossAnalysis
}

export interface AggregatedDetailsAnalysis {
  avgEarlyDeathsWithEnemyJunglerInvolved: number | null
}

export interface AggregatedJungleObjectives {
  firstDragonRate: number
  soloDragonRate: number
  avgDragons: number
  avgFirstDragonTime: number | null
  avgVoidgrubs: number
  avgFirstVoidgrubTime: number | null
  avgHeralds: number
  avgFirstHeraldTime: number | null
  avgBarons: number
  avgFirstBaronTime: number | null
}

export interface AggregatedJungleFirstClearCamp {
  blue: Record<JungleCamp, number>
  red: Record<JungleCamp, number>
  blueInvade: Record<JungleCamp, number>
  redInvade: Record<JungleCamp, number>
  blueGames: number
  redGames: number
}

export interface AggregatedJungleEarlyGankByTeam {
  blueGames: number
  redGames: number
  blueLevel3GankRate: number
  blueLevel3GankCount: number
  blueLevel3KillPositions: GankPoint[]
  blueLevel4GankRate: number
  blueLevel4GankCount: number
  blueLevel4KillPositions: GankPoint[]
  redLevel3GankRate: number
  redLevel3GankCount: number
  redLevel3KillPositions: GankPoint[]
  redLevel4GankRate: number
  redLevel4GankCount: number
  redLevel4KillPositions: GankPoint[]
}

export interface AggregatedJungleEarlyGank {
  level3GankRate: number
  level3GankCount: number
  level3KillPositions: GankPoint[]
  level4GankRate: number
  level4GankCount: number
  level4KillPositions: GankPoint[]
  byTeam: AggregatedJungleEarlyGankByTeam
}

export interface AggregatedJungleAnalysis {
  gamesAnalyzed: number

  topZoneWeightSum: number
  midZoneWeightSum: number
  botZoneWeightSum: number
  totalZoneWeightSum: number

  avgTopZonePercentage: number
  avgMidZonePercentage: number
  avgBotZonePercentage: number

  totalTopGanks: number
  totalMidGanks: number
  totalBotGanks: number
  avgTopGanks: number
  avgMidGanks: number
  avgBotGanks: number

  objectives: AggregatedJungleObjectives
  firstClearCamp: AggregatedJungleFirstClearCamp
  earlyGank: AggregatedJungleEarlyGank

  gankPositions: GankPoint[]
  minutePositions: MinutePositionPoint[]
}

/**
 * 单英雄的胜负 + 打野信息
 */
export interface AggregatedChampionAnalysis {
  championId: number

  summary: AggregatedSummaryAnalysis
  winLoss: AggregatedWinLossAnalysisMap

  // 该英雄的打野多场聚合；非打野英雄 / 无打野场次为 null
  jungle: AggregatedJungleAnalysis | null
}

export interface SummaryDetailsPair {
  summary: SingleSummaryAnalysis
  details: SingleDetailsAnalysis | null
}

export interface AggregatedAnalysis {
  count: number

  summary: AggregatedSummaryAnalysis
  details: AggregatedDetailsAnalysis | null
  akariScore: AkariScore

  /** 对应了所有游戏的单局分析结果，key 为 gameId */
  map: Record<number, SingleAnalysis>

  teamSide: AggregatedTeamSideAnalysis
  winLoss: AggregatedWinLossAnalysisMap
  spells: AggregatedSpellsAnalysis
  positions: AggregatedPositionAnalysis | null

  champions: Record<number, AggregatedChampionAnalysis>

  /** 全体打野场次的聚合；无打野场次为 null。与 champions[id].jungle 类型完全一致 */
  jungle: AggregatedJungleAnalysis | null

  /** 在这些对局的基础上，哪些对局还额外提供了 details */
  detailsCount: number
}
