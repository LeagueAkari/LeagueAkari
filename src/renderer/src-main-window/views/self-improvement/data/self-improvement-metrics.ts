import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { noZero } from '@shared/data-adapter/utils'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { isPveQueue } from '@shared/types/league-client/match-history'

/** 低于该时长的对局通常为重开或异常结束，不纳入长期统计 */
export const SELF_IMPROVEMENT_MIN_GAME_DURATION = 5 * 60

/** 当前只统计单双排（Ranked Solo/Duo） */
export const SELF_IMPROVEMENT_QUEUE_ID = 420

/** 近期窗口与移动平均的默认场次 */
export const SELF_IMPROVEMENT_RECENT_WINDOW = 10

/** 长期趋势分组默认场次 */
export const SELF_IMPROVEMENT_BUCKET_SIZE = 10

/** 最近对局明细默认展示场次 */
export const SELF_IMPROVEMENT_RECENT_MATCH_LIMIT = 20

/**
 * 可绘制为折线的指标
 */
export type SelfImprovementMetricKey =
  | 'cs'
  | 'csPerMinute'
  | 'goldPerMinute'
  | 'kda'
  | 'visionScorePerMinute'
  | 'damagePerMinute'
  | 'damageGoldEfficiency'
  | 'damageShare'
  | 'wardsPlaced'
  | 'wardsKilled'
  | 'visionWardsBoughtInGame'

/**
 * 单场对局中与该玩家相关的、可用于长期追踪的指标
 */
export interface SelfImprovementMatch {
  gameId: number
  gameCreation: number
  gameDuration: number
  queueId: number
  gameMode: string
  mapId: number
  championId: number
  position: string | null
  win: boolean
  kills: number
  deaths: number
  assists: number
  kda: number
  cs: number
  csPerMinute: number
  gold: number
  goldPerMinute: number
  visionScore: number
  visionScorePerMinute: number
  wardsPlaced: number
  wardsKilled: number
  visionWardsBoughtInGame: number
  damageToChampions: number
  damagePerMinute: number
  /** 伤转率：对英雄伤害 / 获得金币 */
  damageGoldEfficiency: number
  /** 伤害占比：对英雄伤害 / 团队对英雄伤害 */
  damageShare: number
  /** 团队对英雄伤害，用于汇总窗口的伤害占比 */
  teamDamageToChampions: number
}

/**
 * 一个对局窗口内的汇总指标
 *
 * 分均类指标按总时长加权，而不是对每场比率取平均，避免短对局被过度放大。
 */
export interface SelfImprovementSummary {
  count: number
  wins: number
  winRate: number
  totalMinutes: number
  csPerMinute: number
  goldPerMinute: number
  kda: number
  visionScorePerMinute: number
  damagePerMinute: number
}

export interface SelfImprovementDelta {
  csPerMinute: number | null
  goldPerMinute: number | null
  kda: number | null
  visionScorePerMinute: number | null
  damagePerMinute: number | null
  winRate: number | null
}

export interface SelfImprovementWindowComparison {
  recent: SelfImprovementSummary
  previous: SelfImprovementSummary
  delta: SelfImprovementDelta
}

export interface SelfImprovementBucket {
  startGameCreation: number
  endGameCreation: number
  summary: SelfImprovementSummary
}

export type SelfImprovementInsightTone = 'positive' | 'warning' | 'neutral'

export type SelfImprovementInsightCode =
  | 'economyUp'
  | 'economyDown'
  | 'farmingUp'
  | 'farmingDown'
  | 'combatUp'
  | 'combatDown'
  | 'visionUp'
  | 'visionDown'
  | 'winRateUp'
  | 'winRateDown'
  | 'stable'

export interface SelfImprovementInsight {
  code: SelfImprovementInsightCode
  tone: SelfImprovementInsightTone
  /** 变化量的绝对值，展示时按指标格式化 */
  value: number
}

export interface SelfImprovementEconomyStanding {
  latestGoldPerMinute: number
  bestGoldPerMinute: number
  worstGoldPerMinute: number
  gapToBest: number
  /** 最新窗口在全部 10 场窗口中的排名，1 为最佳 */
  latestRank: number
  bucketCount: number
}

const METRIC_VALUE_GETTERS: Record<
  SelfImprovementMetricKey,
  (match: SelfImprovementMatch) => number
> = {
  cs: (match) => match.cs,
  csPerMinute: (match) => match.csPerMinute,
  goldPerMinute: (match) => match.goldPerMinute,
  kda: (match) => match.kda,
  visionScorePerMinute: (match) => match.visionScorePerMinute,
  damagePerMinute: (match) => match.damagePerMinute,
  damageGoldEfficiency: (match) => match.damageGoldEfficiency,
  damageShare: (match) => match.damageShare,
  wardsPlaced: (match) => match.wardsPlaced,
  wardsKilled: (match) => match.wardsKilled,
  visionWardsBoughtInGame: (match) => match.visionWardsBoughtInGame
}

export function getSelfImprovementMetricValue(
  match: SelfImprovementMatch,
  metric: SelfImprovementMetricKey
) {
  return METRIC_VALUE_GETTERS[metric](match)
}

export function createEmptySelfImprovementSummary(): SelfImprovementSummary {
  return {
    count: 0,
    wins: 0,
    winRate: 0,
    totalMinutes: 0,
    csPerMinute: 0,
    goldPerMinute: 0,
    kda: 0,
    visionScorePerMinute: 0,
    damagePerMinute: 0
  }
}

/**
 * 从对局概览中提取该玩家的单场指标
 *
 * 返回 null 表示这场对局不适合纳入长期统计：不是该玩家参与的对局、
 * 重开/异常结束、人机对局、或时长过短。
 */
export function extractSelfImprovementMatch(
  summary: LcuOrSgpGameSummary,
  puuid: string
): SelfImprovementMatch | null {
  const basic = toBasicInfo(summary)
  const participants = toParticipants(summary, basic)
  const participant = participants.find((p) => p.puuid === puuid)

  if (!participant) {
    return null
  }

  if (participant.winResult === 'abort' || participant.winResult === 'remake') {
    return null
  }

  if (basic.gameType !== 'MATCHED_GAME' || isPveQueue(basic.queueId)) {
    return null
  }

  if (basic.gameDuration < SELF_IMPROVEMENT_MIN_GAME_DURATION) {
    return null
  }

  const minutes = basic.gameDuration / 60
  const teamParticipants = participants.filter(
    (item) => item.teamIdentifier === participant.teamIdentifier
  )
  const teamDamageToChampions = teamParticipants.reduce(
    (acc, item) => acc + item.totalDamageDealtToChampions,
    0
  )

  return {
    gameId: basic.gameId,
    gameCreation: basic.gameCreation,
    gameDuration: basic.gameDuration,
    queueId: basic.queueId,
    gameMode: basic.gameMode,
    mapId: basic.mapId,
    championId: participant.championId,
    position: participant.position,
    win: participant.win,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    kda: participant.kda,
    cs: participant.cs,
    csPerMinute: participant.cs / minutes,
    gold: participant.goldEarned,
    goldPerMinute: participant.goldEarned / minutes,
    visionScore: participant.visionScore,
    visionScorePerMinute: participant.visionScore / minutes,
    wardsPlaced: participant.wardsPlaced ?? 0,
    wardsKilled: participant.wardsKilled ?? 0,
    visionWardsBoughtInGame: participant.visionWardsBoughtInGame ?? 0,
    damageToChampions: participant.totalDamageDealtToChampions,
    damagePerMinute: participant.totalDamageDealtToChampions / minutes,
    damageGoldEfficiency: participant.totalDamageDealtToChampions / noZero(participant.goldEarned),
    damageShare: participant.totalDamageDealtToChampions / noZero(teamDamageToChampions),
    teamDamageToChampions
  }
}

/**
 * 按开局时间从早到晚排序，便于折线图从左到右展示
 */
export function sortSelfImprovementMatchesByTime(matches: SelfImprovementMatch[]) {
  return [...matches].sort((a, b) => {
    if (a.gameCreation !== b.gameCreation) {
      return a.gameCreation - b.gameCreation
    }

    return a.gameId - b.gameId
  })
}

export function summarizeSelfImprovementMatches(
  matches: SelfImprovementMatch[]
): SelfImprovementSummary {
  if (matches.length === 0) {
    return createEmptySelfImprovementSummary()
  }

  let wins = 0
  let kills = 0
  let deaths = 0
  let assists = 0
  let totalDuration = 0
  let totalCs = 0
  let totalGold = 0
  let totalVisionScore = 0
  let totalDamage = 0

  for (const match of matches) {
    wins += match.win ? 1 : 0
    kills += match.kills
    deaths += match.deaths
    assists += match.assists
    totalDuration += match.gameDuration
    totalCs += match.cs
    totalGold += match.gold
    totalVisionScore += match.visionScore
    totalDamage += match.damageToChampions
  }

  const count = matches.length
  const totalMinutes = totalDuration / 60

  return {
    count,
    wins,
    winRate: wins / count,
    totalMinutes,
    csPerMinute: totalCs / noZero(totalMinutes),
    goldPerMinute: totalGold / noZero(totalMinutes),
    kda: (kills + assists) / noZero(deaths),
    visionScorePerMinute: totalVisionScore / noZero(totalMinutes),
    damagePerMinute: totalDamage / noZero(totalMinutes)
  }
}

function subtractOrNull(current: number, previous: number, hasPrevious: boolean) {
  return hasPrevious ? current - previous : null
}

/**
 * 将最近的若干场与更早的同等场次对比，用于展示“近期状态”
 *
 * matches 需按时间从早到晚排列。
 */
export function compareRecentSelfImprovementMatches(
  matches: SelfImprovementMatch[],
  windowSize = SELF_IMPROVEMENT_RECENT_WINDOW
): SelfImprovementWindowComparison {
  const recentMatches = matches.slice(-windowSize)
  const previousMatches = matches.slice(-windowSize * 2, -windowSize)

  const recent = summarizeSelfImprovementMatches(recentMatches)
  const previous = summarizeSelfImprovementMatches(previousMatches)
  const hasPrevious = previous.count > 0

  return {
    recent,
    previous,
    delta: {
      csPerMinute: subtractOrNull(recent.csPerMinute, previous.csPerMinute, hasPrevious),
      goldPerMinute: subtractOrNull(recent.goldPerMinute, previous.goldPerMinute, hasPrevious),
      kda: subtractOrNull(recent.kda, previous.kda, hasPrevious),
      visionScorePerMinute: subtractOrNull(
        recent.visionScorePerMinute,
        previous.visionScorePerMinute,
        hasPrevious
      ),
      damagePerMinute: subtractOrNull(
        recent.damagePerMinute,
        previous.damagePerMinute,
        hasPrevious
      ),
      winRate: subtractOrNull(recent.winRate, previous.winRate, hasPrevious)
    }
  }
}

/**
 * 根据近期窗口对比生成可读的问题/进步提示
 *
 * 只返回达到阈值的指标，避免把正常波动解读成问题。
 */
export function buildSelfImprovementInsights(
  comparison: SelfImprovementWindowComparison
): SelfImprovementInsight[] {
  const { recent, previous, delta } = comparison

  if (recent.count === 0 || previous.count === 0) {
    return []
  }

  const insights: SelfImprovementInsight[] = []

  const pushInsight = (
    value: number | null,
    threshold: number,
    upCode: SelfImprovementInsightCode,
    downCode: SelfImprovementInsightCode
  ) => {
    if (value === null) {
      return
    }

    if (value >= threshold) {
      insights.push({ code: upCode, tone: 'positive', value })
    } else if (value <= -threshold) {
      insights.push({ code: downCode, tone: 'warning', value: Math.abs(value) })
    }
  }

  pushInsight(delta.goldPerMinute, 20, 'economyUp', 'economyDown')
  pushInsight(delta.csPerMinute, 0.5, 'farmingUp', 'farmingDown')
  pushInsight(delta.kda, 0.5, 'combatUp', 'combatDown')
  pushInsight(delta.visionScorePerMinute, 0.1, 'visionUp', 'visionDown')
  pushInsight(delta.winRate, 0.1, 'winRateUp', 'winRateDown')

  if (insights.length === 0) {
    return [{ code: 'stable', tone: 'neutral', value: 0 }]
  }

  return insights
    .sort((a, b) => Number(a.tone !== 'warning') - Number(b.tone !== 'warning'))
    .slice(0, 4)
}

/**
 * 将最新窗口的分均经济放进全部历史窗口中定位
 *
 * buckets 需按“最新在前”排列（buildSelfImprovementBuckets 的输出）。
 */
export function evaluateSelfImprovementEconomyStanding(
  buckets: SelfImprovementBucket[]
): SelfImprovementEconomyStanding | null {
  if (buckets.length === 0) {
    return null
  }

  const latestGoldPerMinute = buckets[0].summary.goldPerMinute
  const values = buckets.map((bucket) => bucket.summary.goldPerMinute)
  const bestGoldPerMinute = Math.max(...values)
  const worstGoldPerMinute = Math.min(...values)
  const latestRank = 1 + values.filter((value) => value > latestGoldPerMinute).length

  return {
    latestGoldPerMinute,
    bestGoldPerMinute,
    worstGoldPerMinute,
    gapToBest: Math.max(0, bestGoldPerMinute - latestGoldPerMinute),
    latestRank,
    bucketCount: buckets.length
  }
}

/**
 * 将长期对局按固定场次分组，最新的分组排在最前
 *
 * matches 需按时间从早到晚排列。
 */
export function buildSelfImprovementBuckets(
  matches: SelfImprovementMatch[],
  bucketSize = SELF_IMPROVEMENT_BUCKET_SIZE
): SelfImprovementBucket[] {
  if (bucketSize <= 0 || matches.length === 0) {
    return []
  }

  const buckets: SelfImprovementBucket[] = []

  for (let end = matches.length; end > 0; end -= bucketSize) {
    const start = Math.max(0, end - bucketSize)
    const bucketMatches = matches.slice(start, end)

    buckets.push({
      startGameCreation: bucketMatches[0].gameCreation,
      endGameCreation: bucketMatches[bucketMatches.length - 1].gameCreation,
      summary: summarizeSelfImprovementMatches(bucketMatches)
    })
  }

  return buckets
}

/**
 * 按固定场次计算移动平均
 *
 * 窗口未填满时返回 null，图表会跳过前置空值，避免开头出现失真的均值。
 */
export function buildSelfImprovementMovingAverage(
  values: number[],
  windowSize = SELF_IMPROVEMENT_RECENT_WINDOW
): (number | null)[] {
  if (windowSize <= 0) {
    return values.map(() => null)
  }

  const result: (number | null)[] = []
  let sum = 0

  for (let i = 0; i < values.length; i++) {
    sum += values[i]

    if (i >= windowSize) {
      sum -= values[i - windowSize]
    }

    result.push(i >= windowSize - 1 ? sum / windowSize : null)
  }

  return result
}
