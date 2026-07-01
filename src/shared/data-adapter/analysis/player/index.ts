import { isPveQueue } from '@shared/types/league-client/match-history'

import { MatchBasicInfo, toBasicInfo } from '../../match-history/match-basic'
import { MatchParticipant, toParticipants } from '../../match-history/participants'
import { computeAggregatedAkariScore } from './aggregate/akari'
import { computeAggregatedChampions } from './aggregate/champions'
import { computeAggregatedDetails } from './aggregate/details'
import { computeAggregatedJungle } from './aggregate/jungle'
import { computeAggregatedPositions } from './aggregate/positions'
import { computeAggregatedSpells } from './aggregate/spells'
import { computeAggregatedSummary } from './aggregate/summary'
import { computeAggregatedTeamSide } from './aggregate/team-side'
import { computeAggregatedWinLossMap } from './aggregate/win-loss'
import { computeSingleAkariScore } from './single/akari'
import { computeSingleDetails } from './single/details'
import { computeSingleSummary } from './single/summary'
import type { AggregatedAnalysis } from './types/aggregated'
import type { PreparedGame } from './types/helpers'
import type { GameSummaryWithOptionalDetails, SingleAnalysis } from './types/single'

export { computeAggregatedAkariScore, computeSingleAkariScore }

export * from './types/helpers'
export * from './types/single'
export * from './types/aggregated'

export interface AnalyzeGamesOptions {
  /** 复用上一次的结果 */
  previous?: AggregatedAnalysis

  /** 是否过滤掉PVE和非匹配游戏，默认过滤 */
  filterPveAndNonMatchedGames?: boolean

  /** 是否过滤掉已取消或重开的游戏，默认过滤 */
  filterAbortedOrRemadeGames?: boolean
}

function isPveOrNonMatchedGame(basic: MatchBasicInfo) {
  return basic.gameType !== 'MATCHED_GAME' || isPveQueue(basic.queueId)
}

function isAbortedOrRemadeGame(participant: MatchParticipant) {
  return participant.winResult === 'abort' || participant.winResult === 'remake'
}

export function analyzeGames(
  games: GameSummaryWithOptionalDetails[],
  puuid: string,
  options?: AnalyzeGamesOptions
): AggregatedAnalysis | null {
  if (games.length === 0) {
    return null
  }

  const { filterAbortedOrRemadeGames = true, filterPveAndNonMatchedGames = true } = options || {}

  const prepared: PreparedGame[] = []

  for (const g of games) {
    const basic = toBasicInfo(g.summary)

    if (filterPveAndNonMatchedGames && isPveOrNonMatchedGame(basic)) continue

    const participants = toParticipants(g.summary, basic)
    const participant = participants.find((p) => p.puuid === puuid)

    if (!participant) continue
    if (filterAbortedOrRemadeGames && isAbortedOrRemadeGame(participant)) continue

    // previous 的设计为了优化计算 details 的高性能损耗
    // 如果这里 details 存在性发生变动，则立即重新计算
    const cachedSingle = options?.previous?.map[g.gameId]
    const canReuseCachedSingle =
      !!cachedSingle && Boolean(g.details) === (cachedSingle.details !== null)

    let single: SingleAnalysis
    if (canReuseCachedSingle) {
      single = cachedSingle
    } else {
      const teamParticipants = participants.filter(
        (p) => p.teamIdentifier === participant.teamIdentifier
      )
      const summaryAnalysis = computeSingleSummary(
        basic,
        participant,
        teamParticipants,
        participants
      )
      const detailsAnalysis = g.details
        ? computeSingleDetails(g.details, basic, participant, participants)
        : null

      single = {
        gameId: g.gameId,
        summary: summaryAnalysis,
        details: detailsAnalysis,
        akariScore: computeSingleAkariScore(summaryAnalysis)
      }
    }

    prepared.push({
      gameId: g.gameId,
      basic,
      participant,
      participants,
      single
    })
  }

  const count = prepared.length
  const summary = computeAggregatedSummary(prepared)

  let detailsCount = 0
  const map: Record<number, SingleAnalysis> = {}
  for (const p of prepared) {
    map[p.gameId] = p.single
    if (p.single.details !== null) detailsCount++
  }

  return {
    count,
    summary,
    details: computeAggregatedDetails(prepared),
    akariScore: computeAggregatedAkariScore({ count, summary, games: prepared }),
    map,
    teamSide: computeAggregatedTeamSide(prepared),
    winLoss: computeAggregatedWinLossMap(prepared),
    spells: computeAggregatedSpells(prepared),
    positions: computeAggregatedPositions(prepared),
    champions: computeAggregatedChampions(prepared),
    jungle: computeAggregatedJungle(prepared),
    detailsCount
  }
}

export function analyzeGame(
  { gameId, summary, details }: GameSummaryWithOptionalDetails,
  puuid: string
): SingleAnalysis | null {
  const basic = toBasicInfo(summary)
  const participants = toParticipants(summary, basic)
  const participant = participants.find((p) => p.puuid === puuid)

  if (!participant) {
    return null
  }

  const teamParticipants = participants.filter(
    (p) => p.teamIdentifier === participant.teamIdentifier
  )

  const summaryAnalysis = computeSingleSummary(basic, participant, teamParticipants, participants)

  const detailsAnalysis = details
    ? computeSingleDetails(details, basic, participant, participants)
    : null

  return {
    gameId,
    summary: summaryAnalysis,
    details: detailsAnalysis,
    akariScore: computeSingleAkariScore(summaryAnalysis)
  }
}
