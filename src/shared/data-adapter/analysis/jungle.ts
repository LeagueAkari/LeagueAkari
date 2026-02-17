import { toBasicInfo } from '../match-history/match-basic'
import { toParticipants } from '../match-history/participants'
import { toFrames } from '../match-history/frames'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '../wrapper'

export type GankLane = 'top' | 'mid' | 'bot'

export interface GankPoint {
  x: number
  y: number
  lane: GankLane
}

export interface JunglePathingStats {
  gamesAnalyzed: number

  /** 上半区偏好比例 0-1, >0.5 偏上 */
  avgTopsidePercentage: number

  /** 前20分钟 Gank 统计 */
  totalTopGanks: number
  totalMidGanks: number
  totalBotGanks: number
  avgTopGanks: number
  avgMidGanks: number
  avgBotGanks: number

  /** 按阵营分的首清统计 */
  blueTeamGames: number
  blueTeamTopsideStartCount: number
  redTeamGames: number
  redTeamTopsideStartCount: number

  /** Gank 坐标点（用于地图可视化） */
  gankPositions: GankPoint[]
}

export interface JunglePathingAnalysis {
  /** 总体打野分析（所有打野局，最多50局） */
  overall: JunglePathingStats
  /** 当前英雄打野分析（最多20局），如果没有打野局则为 null */
  currentChampion: JunglePathingStats | null
  /** 当前英雄 ID */
  currentChampionId: number
}

/** 前15分钟帧用于判断半区偏好 */
const PATHING_MINUTES = 15
/** 前20分钟击杀用于判断 Gank */
const GANK_MINUTES = 20
/** 首清方向看第1帧（1分钟时的位置） */
const FIRST_CLEAR_FRAME = 1
/** 当前英雄分析最多局数 */
const CURRENT_CHAMPION_MAX_GAMES = 20

/**
 * 判断坐标是否在上半区
 * 蓝方(100): y > x 为上半区；红方(200): y < x 为上半区
 */
function isTopside(x: number, y: number, teamId: number): boolean {
  if (teamId === 100) {
    return y > x
  }
  return y < x
}

/**
 * 根据坐标判断 Gank 路线
 */
function classifyGankLane(x: number, y: number): GankLane | null {
  if (x < 5000 && y > 9000) return 'top'
  if (x > 9000 && y < 5000) return 'bot'

  const distFromDiag = Math.abs(y - x)
  const midPoint = (x + y) / 2
  if (distFromDiag < 4000 && midPoint > 3000 && midPoint < 12000) return 'mid'

  return null
}

function findParticipantInfo(
  summary: LcuOrSgpGameSummary,
  puuid: string
): { participantId: number; teamId: number; championId: number } | null {
  const basicInfo = toBasicInfo(summary)
  const participants = toParticipants(summary, basicInfo)
  const p = participants.find((pp) => pp.puuid === puuid)
  if (!p) return null
  return { participantId: p.participantId, teamId: p.teamId, championId: p.championId }
}

function isJungleInGame(summary: LcuOrSgpGameSummary, puuid: string): boolean {
  const basicInfo = toBasicInfo(summary)
  const participants = toParticipants(summary, basicInfo)
  const p = participants.find((pp) => pp.puuid === puuid)
  if (!p) return false

  if (p.position && p.position.toUpperCase() === 'JUNGLE') return true
  if (p.spells.includes(11)) return true

  return false
}

/** 击杀参与相对于时间线位置的权重 */
const KILL_WEIGHT = 5

interface SingleGameAnalysis {
  /** 加权后的上半区偏好 0-1 */
  topsidePercent: number | null
  topGanks: number
  midGanks: number
  botGanks: number
  /** 所在阵营 100=蓝 200=红 */
  teamId: number
  topsideStart: boolean | null
  gankPositions: GankPoint[]
}

/**
 * 分析单场对局的打野数据
 */
function analyzeOneGame(
  detail: LcuOrSgpGameDetails,
  summary: LcuOrSgpGameSummary,
  puuid: string
): SingleGameAnalysis | null {
  const basicInfo = toBasicInfo(summary)
  if (basicInfo.mapId !== 11) return null
  if (basicInfo.gameMode === 'CHERRY' || basicInfo.gameMode === 'PRACTICETOOL') return null

  const pInfo = findParticipantInfo(summary, puuid)
  if (!pInfo) return null

  const frames = toFrames(detail)
  if (!frames.length) return null

  const { participantId, teamId } = pInfo
  const pidKey = participantId.toString()

  // 1. 半区偏好（前15分钟）
  let topsideFrames = 0
  let totalFrames = 0
  const pathingFrameLimit = Math.min(frames.length, PATHING_MINUTES + 1)

  for (let i = 1; i < pathingFrameLimit; i++) {
    const frame = frames[i]
    const pf = frame.participantFrames[pidKey]
    if (!pf || !pf.position) continue

    totalFrames++
    if (isTopside(pf.position.x, pf.position.y, teamId)) {
      topsideFrames++
    }
  }

  // 2. Gank 分析（前20分钟）+ 击杀参与的半区加权
  const gankTimeLimitMs = GANK_MINUTES * 60 * 1000
  let topGanks = 0
  let midGanks = 0
  let botGanks = 0
  const gankPositions: GankPoint[] = []

  // 击杀参与位置的加权统计（权重 KILL_WEIGHT）
  let killTopsideWeighted = 0
  let killTotalWeighted = 0

  for (const frame of frames) {
    if (!frame.events) continue
    for (const event of frame.events) {
      if (event.type !== 'CHAMPION_KILL') continue
      if (event.timestamp > gankTimeLimitMs) continue

      const killEvent = event as {
        killerId: number
        victimId: number
        assistingParticipantIds?: number[]
        position: { x: number; y: number }
      }

      const isKiller = killEvent.killerId === participantId
      const isAssist = killEvent.assistingParticipantIds?.includes(participantId) ?? false
      if (!isKiller && !isAssist) continue

      // 击杀参与位置加权计入半区偏好
      killTotalWeighted += KILL_WEIGHT
      if (isTopside(killEvent.position.x, killEvent.position.y, teamId)) {
        killTopsideWeighted += KILL_WEIGHT
      }

      const lane = classifyGankLane(killEvent.position.x, killEvent.position.y)
      if (!lane) continue

      switch (lane) {
        case 'top':
          topGanks++
          break
        case 'mid':
          midGanks++
          break
        case 'bot':
          botGanks++
          break
      }

      gankPositions.push({ x: killEvent.position.x, y: killEvent.position.y, lane })
    }
  }

  // 3. 首清方向（看第1帧位置）
  let topsideStart: boolean | null = null
  if (frames.length > FIRST_CLEAR_FRAME) {
    const pf = frames[FIRST_CLEAR_FRAME].participantFrames[pidKey]
    if (pf?.position) {
      topsideStart = isTopside(pf.position.x, pf.position.y, teamId)
    }
  }

  // 加权半区偏好 = (时间线位置权重1 + 击杀参与位置权重5) / 总权重
  const combinedTotal = totalFrames + killTotalWeighted
  const combinedTopside = topsideFrames + killTopsideWeighted

  return {
    topsidePercent: combinedTotal > 0 ? combinedTopside / combinedTotal : null,
    topGanks,
    midGanks,
    botGanks,
    teamId,
    topsideStart,
    gankPositions
  }
}

function aggregateStats(results: SingleGameAnalysis[]): JunglePathingStats | null {
  const validResults = results.filter((r) => r.topsidePercent !== null)
  if (validResults.length === 0) return null

  const gamesAnalyzed = validResults.length
  let totalTopsidePercent = 0
  let totalTopGanks = 0
  let totalMidGanks = 0
  let totalBotGanks = 0
  let blueTeamGames = 0
  let blueTeamTopsideStartCount = 0
  let redTeamGames = 0
  let redTeamTopsideStartCount = 0
  const gankPositions: GankPoint[] = []

  for (const r of validResults) {
    totalTopsidePercent += r.topsidePercent!
    totalTopGanks += r.topGanks
    totalMidGanks += r.midGanks
    totalBotGanks += r.botGanks

    if (r.topsideStart !== null) {
      if (r.teamId === 100) {
        blueTeamGames++
        if (r.topsideStart) blueTeamTopsideStartCount++
      } else {
        redTeamGames++
        if (r.topsideStart) redTeamTopsideStartCount++
      }
    }

    gankPositions.push(...r.gankPositions)
  }

  return {
    gamesAnalyzed,
    avgTopsidePercentage: totalTopsidePercent / gamesAnalyzed,
    totalTopGanks,
    totalMidGanks,
    totalBotGanks,
    avgTopGanks: totalTopGanks / gamesAnalyzed,
    avgMidGanks: totalMidGanks / gamesAnalyzed,
    avgBotGanks: totalBotGanks / gamesAnalyzed,
    blueTeamGames,
    blueTeamTopsideStartCount,
    redTeamGames,
    redTeamTopsideStartCount,
    gankPositions
  }
}

/**
 * 分析打野玩家的路径偏好，分当前英雄和总体
 * @param currentChampionId 当前对局选择的英雄 ID
 */
export function analyzeJunglePathing(
  details: LcuOrSgpGameDetails[],
  summaries: LcuOrSgpGameSummary[],
  puuid: string,
  currentChampionId: number
): JunglePathingAnalysis | null {
  const summaryMap = new Map(summaries.map((s) => [s.gameId, s]))

  const allResults: SingleGameAnalysis[] = []
  const champResults: SingleGameAnalysis[] = []

  for (const detail of details) {
    const summary = summaryMap.get(detail.gameId)
    if (!summary) continue

    const pInfo = findParticipantInfo(summary, puuid)
    if (!pInfo) continue

    const result = analyzeOneGame(detail, summary, puuid)
    if (!result) continue

    allResults.push(result)

    if (pInfo.championId === currentChampionId && champResults.length < CURRENT_CHAMPION_MAX_GAMES) {
      champResults.push(result)
    }
  }

  const overall = aggregateStats(allResults)
  if (!overall) return null

  const currentChampion = aggregateStats(champResults)

  return {
    overall,
    currentChampion,
    currentChampionId
  }
}

/**
 * 判断一组战绩中哪些是打野局，返回这些局的 gameId
 */
export function filterJungleGames(
  summaries: LcuOrSgpGameSummary[],
  puuid: string
): number[] {
  return summaries
    .filter((s) => {
      const basicInfo = toBasicInfo(s)
      if (basicInfo.mapId !== 11) return false
      if (basicInfo.gameMode === 'CHERRY' || basicInfo.gameMode === 'PRACTICETOOL') return false
      return isJungleInGame(s, puuid)
    })
    .map((s) => s.gameId)
}
