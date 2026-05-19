import { describe, expect, it } from 'vitest'

import { analyzeGames } from '..'
import type { SgpGameSummaryLol } from '../../../../types/sgp/match-history'
import { getCherryTeamCount } from '../../../match-history/cherry'
import { toBasicInfo } from '../../../match-history/match-basic'
import { toParticipants } from '../../../match-history/participants'
import { getOnlySgpGame, wrapSgpSummary } from '../test-utils/fixtures'
import type { PreparedGame } from '../types/helpers'
import type { SingleAnalysis } from '../types/single'
import { computeAggregatedCherryWinLoss } from './win-loss'

const ARENA_FIXTURE_PLAYER_PUUID = '7508051a-17f9-59cb-9468-7ddfaf49d142'

function prepareGame(game: SgpGameSummaryLol, subteamPlacement: number): PreparedGame {
  const summary = wrapSgpSummary(game)
  const basic = toBasicInfo(summary)
  const participants = toParticipants(summary, basic)
  const participant = participants.find((p) => p.subteamPlacement === subteamPlacement)

  if (!participant) {
    throw new Error(`Fixture ${game.json.gameId} has no participant placed ${subteamPlacement}`)
  }

  return {
    gameId: game.json.gameId,
    basic,
    participant,
    participants,
    single: {} as SingleAnalysis
  }
}

describe('computeAggregatedCherryWinLoss', () => {
  it('counts top half as top 3 in real six-team Arena summary data', () => {
    const game = getOnlySgpGame('q_1750')
    const top3 = prepareGame(game, 3)
    const top4 = prepareGame(game, 4)
    const result = computeAggregatedCherryWinLoss([top3, top4])

    expect(game.json.queueId).toBe(1750)
    expect(getCherryTeamCount(top3.participants)).toBe(6)
    expect(top3.participants).toHaveLength(18)
    expect(result.topHalfFinishes).toBe(1)
    expect(result.topHalfRate).toBe(0.5)
    expect(result.wins).toBe(1)
    expect(result.losses).toBe(1)
  })

  it('counts top half as top 4 in real eight-team Arena summary data', () => {
    const game = getOnlySgpGame('q_1700')
    const top4 = prepareGame(game, 4)
    const top5 = prepareGame(game, 5)
    const result = computeAggregatedCherryWinLoss([top4, top5])

    expect(game.json.queueId).toBe(1700)
    expect(getCherryTeamCount(top4.participants)).toBe(8)
    expect(top4.participants).toHaveLength(16)
    expect(result.topHalfFinishes).toBe(1)
    expect(result.topHalfRate).toBe(0.5)
    expect(result.wins).toBe(1)
    expect(result.losses).toBe(1)
  })
})

describe('analyzeGames', () => {
  it('analyzes real 1750 and 1700 Arena summaries for the fixture player', () => {
    const games = [getOnlySgpGame('q_1750'), getOnlySgpGame('q_1700')].map((game) => ({
      gameId: game.json.gameId,
      summary: wrapSgpSummary(game)
    }))
    const result = analyzeGames(games, ARENA_FIXTURE_PLAYER_PUUID)

    expect(result?.winLoss.cherry.count).toBe(2)
    expect(result?.winLoss.cherry.wins).toBe(2)
    expect(result?.winLoss.cherry.topHalfFinishes).toBe(2)
    expect(result?.winLoss.cherry.topHalfRate).toBe(1)
  })
})
