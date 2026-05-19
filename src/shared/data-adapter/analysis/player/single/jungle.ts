import { isSgpDetailedParticipantFrame } from '../../../match-history/frames'
import type { MatchParticipant } from '../../../match-history/participants'
import { ANALYSIS_MINUTES, FIRST_CLEAR_FRAME, KILL_WEIGHT } from '../constants'
import type {
  AnyTimelineFrame,
  CampSide,
  GankPoint,
  JungleCamp,
  MinutePositionPoint
} from '../types/helpers'
import type { SingleJungleAnalysis } from '../types/single'
import { classifyGankLane, classifyMapZone, detectStartCamp } from '../utils/geometry'

export function computeSingleJungle(
  frames: AnyTimelineFrame[],
  participant: MatchParticipant
): SingleJungleAnalysis {
  const { participantId } = participant

  let totalFrames = 0
  let topZoneFramesWeighted = 0
  let midZoneFramesWeighted = 0
  let botZoneFramesWeighted = 0
  const minutePositions: MinutePositionPoint[] = []
  const pathingFrameLimit = Math.min(frames.length, ANALYSIS_MINUTES + 1)

  for (let i = 1; i < pathingFrameLimit; i++) {
    const frame = frames[i]
    const pf = frame.participantFrames[participantId]
    if (!pf || !pf.position) continue

    totalFrames++
    const zone = classifyMapZone(pf.position.x, pf.position.y)
    minutePositions.push({ x: pf.position.x, y: pf.position.y, lane: zone, minute: i })
    switch (zone) {
      case 'top':
        topZoneFramesWeighted += 1
        break
      case 'mid':
        midZoneFramesWeighted += 1
        break
      case 'bot':
        botZoneFramesWeighted += 1
        break
    }
  }

  const gankTimeLimitMs = ANALYSIS_MINUTES * 60 * 1000
  let topGanks = 0
  let midGanks = 0
  let botGanks = 0
  const gankPositions: GankPoint[] = []

  let killTotalWeighted = 0
  let killTopZoneWeighted = 0
  let killMidZoneWeighted = 0
  let killBotZoneWeighted = 0

  for (const frame of frames) {
    if (!frame.events) continue
    for (const event of frame.events) {
      if (event.type !== 'CHAMPION_KILL') continue
      if (event.timestamp > gankTimeLimitMs) continue

      const isKiller = event.killerId === participantId
      const isAssist = event.assistingParticipantIds?.includes(participantId) ?? false
      if (!isKiller && !isAssist) continue

      killTotalWeighted += KILL_WEIGHT
      const zone = classifyMapZone(event.position.x, event.position.y)
      switch (zone) {
        case 'top':
          killTopZoneWeighted += KILL_WEIGHT
          break
        case 'mid':
          killMidZoneWeighted += KILL_WEIGHT
          break
        case 'bot':
          killBotZoneWeighted += KILL_WEIGHT
          break
      }

      const lane = classifyGankLane(event.position.x, event.position.y)
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

      gankPositions.push({ x: event.position.x, y: event.position.y, lane })
    }
  }

  let startCamp: { camp: JungleCamp; side: CampSide } | null = null
  if (frames.length > FIRST_CLEAR_FRAME) {
    const pf = frames[FIRST_CLEAR_FRAME].participantFrames[participantId]
    if (pf?.position) {
      startCamp = detectStartCamp(pf.position.x, pf.position.y)
    }
  }

  const level3KillPositions: GankPoint[] = []
  const level4KillPositions: GankPoint[] = []
  let level3GankDetected = false
  let level4GankDetected = false

  for (const frame of frames) {
    if (!frame.events) continue
    for (const event of frame.events) {
      if (event.type !== 'CHAMPION_KILL') continue
      if (event.timestamp > 240000) continue

      if (
        event.killerId !== participantId &&
        !event.assistingParticipantIds?.includes(participantId)
      )
        continue

      const lane = classifyGankLane(event.position.x, event.position.y)
      const pt: GankPoint = {
        x: event.position.x,
        y: event.position.y,
        lane: lane ?? classifyMapZone(event.position.x, event.position.y)
      }

      if (event.timestamp <= 180000) {
        level3KillPositions.push(pt)
      } else {
        level4KillPositions.push(pt)
      }
    }
  }

  if (frames.length > 3) {
    const pf3 = frames[3].participantFrames[participantId]
    if (pf3) {
      const cs3 = (pf3.minionsKilled ?? 0) + (pf3.jungleMinionsKilled ?? 0)
      const level3 = pf3.level ?? 0

      let hasChampionDamageAt3 = false
      let damageToChampionsAt3 = 0
      if (isSgpDetailedParticipantFrame(pf3)) {
        damageToChampionsAt3 = pf3.damageStats.totalDamageDoneToChampions
        hasChampionDamageAt3 = damageToChampionsAt3 > 0
      } else {
        hasChampionDamageAt3 = level3KillPositions.length > 0
      }

      if (cs3 >= 12 && cs3 < 20 && level3 === 3 && hasChampionDamageAt3) {
        level3GankDetected = true
      }

      if (frames.length > 4) {
        const pf4 = frames[4].participantFrames[participantId]
        if (pf4) {
          let hasChampionDamageAt4 = false
          if (isSgpDetailedParticipantFrame(pf4)) {
            hasChampionDamageAt4 =
              pf4.damageStats.totalDamageDoneToChampions > damageToChampionsAt3 ||
              level4KillPositions.length > 0
          } else {
            hasChampionDamageAt4 = level4KillPositions.length > 0
          }

          if (hasChampionDamageAt4) {
            level4GankDetected = true
          }
        }
      }
    }
  }

  const combinedTotal = totalFrames + killTotalWeighted
  const combinedTopZone = topZoneFramesWeighted + killTopZoneWeighted
  const combinedMidZone = midZoneFramesWeighted + killMidZoneWeighted
  const combinedBotZone = botZoneFramesWeighted + killBotZoneWeighted

  return {
    topZoneWeightSum: combinedTopZone,
    midZoneWeightSum: combinedMidZone,
    botZoneWeightSum: combinedBotZone,
    totalZoneWeightSum: combinedTotal,
    topGanks,
    midGanks,
    botGanks,
    startCamp,
    level3GankDetected,
    level4GankDetected,
    level3KillPositions,
    level4KillPositions,
    gankPositions,
    minutePositions
  }
}
