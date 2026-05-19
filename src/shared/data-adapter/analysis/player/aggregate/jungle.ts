import type {
  AggregatedJungleAnalysis,
  AggregatedJungleEarlyGank,
  AggregatedJungleEarlyGankByTeam,
  AggregatedJungleFirstClearCamp,
  AggregatedJungleObjectives
} from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import type { GankPoint, MinutePositionPoint } from '../types/helpers'
import type { SingleJungleAnalysis, SingleObjectivesAnalysis } from '../types/single'
import { emptyCampCount } from '../utils/empty'
import { avgOrNull } from '../utils/math'

interface JungleSample {
  jungle: SingleJungleAnalysis
  objectives: SingleObjectivesAnalysis
  isBlue: boolean
}

export function computeAggregatedJungle(games: PreparedGame[]): AggregatedJungleAnalysis | null {
  const samples: JungleSample[] = []
  for (const g of games) {
    const jungle = g.single.details?.jungle
    const objectives = g.single.details?.objectives
    if (!jungle || !objectives) continue
    samples.push({
      jungle,
      objectives,
      isBlue: g.participant.teamIdentifier === 'TEAM-100'
    })
  }

  if (samples.length === 0) return null

  const gamesAnalyzed = samples.length

  // 三分区权重
  let topZoneWeightSum = 0
  let midZoneWeightSum = 0
  let botZoneWeightSum = 0
  let totalZoneWeightSum = 0

  // gank 统计
  let totalTopGanks = 0
  let totalMidGanks = 0
  let totalBotGanks = 0

  // earlyGank 顶层
  let level3GankCount = 0
  let level4GankCount = 0
  const level3KillPositions: GankPoint[] = []
  const level4KillPositions: GankPoint[] = []

  // earlyGank byTeam
  let blueGames = 0
  let redGames = 0
  let blueLevel3GankCount = 0
  let blueLevel4GankCount = 0
  let redLevel3GankCount = 0
  let redLevel4GankCount = 0
  const blueLevel3KillPositions: GankPoint[] = []
  const blueLevel4KillPositions: GankPoint[] = []
  const redLevel3KillPositions: GankPoint[] = []
  const redLevel4KillPositions: GankPoint[] = []

  // firstClearCamp
  const blueCamps = emptyCampCount()
  const redCamps = emptyCampCount()
  const blueInvadeCamps = emptyCampCount()
  const redInvadeCamps = emptyCampCount()
  let firstClearBlueGames = 0
  let firstClearRedGames = 0

  // objectives
  let firstDragonTotal = 0
  let firstDragonCount = 0
  let totalDragons = 0
  let totalSoloDragons = 0
  let totalVoidgrubs = 0
  let totalHeralds = 0
  let totalBarons = 0
  const firstDragonTimes: number[] = []
  const firstVoidgrubTimes: number[] = []
  const firstHeraldTimes: number[] = []
  const firstBaronTimes: number[] = []

  // 位置数组
  const gankPositions: GankPoint[] = []
  const minutePositions: MinutePositionPoint[] = []

  for (const s of samples) {
    const j = s.jungle
    const o = s.objectives

    topZoneWeightSum += j.topZoneWeightSum
    midZoneWeightSum += j.midZoneWeightSum
    botZoneWeightSum += j.botZoneWeightSum
    totalZoneWeightSum += j.totalZoneWeightSum

    totalTopGanks += j.topGanks
    totalMidGanks += j.midGanks
    totalBotGanks += j.botGanks

    if (j.level3GankDetected) level3GankCount++
    if (j.level4GankDetected) level4GankCount++
    level3KillPositions.push(...j.level3KillPositions)
    level4KillPositions.push(...j.level4KillPositions)

    if (s.isBlue) {
      blueGames++
      if (j.level3GankDetected) blueLevel3GankCount++
      if (j.level4GankDetected) blueLevel4GankCount++
      blueLevel3KillPositions.push(...j.level3KillPositions)
      blueLevel4KillPositions.push(...j.level4KillPositions)
    } else {
      redGames++
      if (j.level3GankDetected) redLevel3GankCount++
      if (j.level4GankDetected) redLevel4GankCount++
      redLevel3KillPositions.push(...j.level3KillPositions)
      redLevel4KillPositions.push(...j.level4KillPositions)
    }

    // firstClearCamp：startCamp 非 null 才计入
    if (j.startCamp !== null) {
      if (s.isBlue) {
        firstClearBlueGames++
        if (j.startCamp.side === 'blue') {
          blueCamps[j.startCamp.camp]++
        } else {
          blueInvadeCamps[j.startCamp.camp]++
        }
      } else {
        firstClearRedGames++
        if (j.startCamp.side === 'red') {
          redCamps[j.startCamp.camp]++
        } else {
          redInvadeCamps[j.startCamp.camp]++
        }
      }
    }

    // objectives
    if (o.gotFirstDragon !== null) {
      firstDragonTotal++
      if (o.gotFirstDragon) firstDragonCount++
    }
    totalDragons += o.dragons
    totalSoloDragons += o.soloDragons
    totalVoidgrubs += o.voidgrubs
    totalHeralds += o.heralds
    totalBarons += o.barons
    if (o.firstDragonTime !== null) firstDragonTimes.push(o.firstDragonTime)
    if (o.firstVoidgrubTime !== null) firstVoidgrubTimes.push(o.firstVoidgrubTime)
    if (o.firstHeraldTime !== null) firstHeraldTimes.push(o.firstHeraldTime)
    if (o.firstBaronTime !== null) firstBaronTimes.push(o.firstBaronTime)

    gankPositions.push(...j.gankPositions)
    minutePositions.push(...j.minutePositions)
  }

  const objectives: AggregatedJungleObjectives = {
    firstDragonRate: firstDragonTotal > 0 ? firstDragonCount / firstDragonTotal : 0,
    soloDragonRate: totalDragons > 0 ? totalSoloDragons / totalDragons : 0,
    avgDragons: totalDragons / gamesAnalyzed,
    avgFirstDragonTime: avgOrNull(firstDragonTimes),
    avgVoidgrubs: totalVoidgrubs / gamesAnalyzed,
    avgFirstVoidgrubTime: avgOrNull(firstVoidgrubTimes),
    avgHeralds: totalHeralds / gamesAnalyzed,
    avgFirstHeraldTime: avgOrNull(firstHeraldTimes),
    avgBarons: totalBarons / gamesAnalyzed,
    avgFirstBaronTime: avgOrNull(firstBaronTimes)
  }

  const firstClearCamp: AggregatedJungleFirstClearCamp = {
    blue: blueCamps,
    red: redCamps,
    blueInvade: blueInvadeCamps,
    redInvade: redInvadeCamps,
    blueGames: firstClearBlueGames,
    redGames: firstClearRedGames
  }

  const byTeam: AggregatedJungleEarlyGankByTeam = {
    blueGames,
    redGames,
    blueLevel3GankRate: blueGames > 0 ? blueLevel3GankCount / blueGames : 0,
    blueLevel3GankCount,
    blueLevel3KillPositions,
    blueLevel4GankRate: blueGames > 0 ? blueLevel4GankCount / blueGames : 0,
    blueLevel4GankCount,
    blueLevel4KillPositions,
    redLevel3GankRate: redGames > 0 ? redLevel3GankCount / redGames : 0,
    redLevel3GankCount,
    redLevel3KillPositions,
    redLevel4GankRate: redGames > 0 ? redLevel4GankCount / redGames : 0,
    redLevel4GankCount,
    redLevel4KillPositions
  }

  const earlyGank: AggregatedJungleEarlyGank = {
    level3GankRate: level3GankCount / gamesAnalyzed,
    level3GankCount,
    level3KillPositions,
    level4GankRate: level4GankCount / gamesAnalyzed,
    level4GankCount,
    level4KillPositions,
    byTeam
  }

  return {
    gamesAnalyzed,

    topZoneWeightSum,
    midZoneWeightSum,
    botZoneWeightSum,
    totalZoneWeightSum,

    avgTopZonePercentage: totalZoneWeightSum > 0 ? topZoneWeightSum / totalZoneWeightSum : 0,
    avgMidZonePercentage: totalZoneWeightSum > 0 ? midZoneWeightSum / totalZoneWeightSum : 0,
    avgBotZonePercentage: totalZoneWeightSum > 0 ? botZoneWeightSum / totalZoneWeightSum : 0,

    totalTopGanks,
    totalMidGanks,
    totalBotGanks,
    avgTopGanks: totalTopGanks / gamesAnalyzed,
    avgMidGanks: totalMidGanks / gamesAnalyzed,
    avgBotGanks: totalBotGanks / gamesAnalyzed,

    objectives,
    firstClearCamp,
    earlyGank,

    gankPositions,
    minutePositions
  }
}
