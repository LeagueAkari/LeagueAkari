import { describe, expect, it } from 'vitest'

import { toFrames } from '../../match-history/frames'
import { toBasicInfo } from '../../match-history/match-basic'
import { toParticipants } from '../../match-history/participants'
import {
  LCU_GAME_FIXTURES,
  SGP_QUEUE_FIXTURES,
  getOnlySgpGame,
  readLcuGameFixture,
  readLcuMatchHistoryFixture,
  readLcuTimelineFixture,
  readSgpMatchHistoryFixture,
  wrapLcuGame,
  wrapLcuTimeline,
  wrapSgpSummary
} from './test-utils/fixtures'

describe('raw SGP match-history-query fixtures', () => {
  it('keeps API responses without test metadata wrappers', () => {
    expect(Object.keys(readSgpMatchHistoryFixture('q_1750'))).toEqual(['games'])
  })

  it.each(SGP_QUEUE_FIXTURES)('loads %s as queue %i', (fixtureName, queueId) => {
    const game = getOnlySgpGame(fixtureName)
    const summary = wrapSgpSummary(game)
    const basic = toBasicInfo(summary)
    const participants = toParticipants(summary, basic)

    expect(game.json.queueId).toBe(queueId)
    expect(basic.queueId).toBe(queueId)
    expect(participants.length).toBe(game.json.participants.length)
  })

  it.each(['all', 'ranked', 'normal'])('loads %s raw data', (fixtureName) => {
    const game = getOnlySgpGame(fixtureName)

    expect(game.json.gameId).toBeGreaterThan(0)
    expect(game.json.participants.length).toBeGreaterThan(0)
  })
})

describe('raw LCU match-history fixtures', () => {
  it('keeps current summoner match-history page as a raw LCU response', () => {
    const page = readLcuMatchHistoryFixture()

    expect(Object.keys(page).sort()).toEqual(['accountId', 'games', 'platformId'])
    expect(page.games.games.length).toBeGreaterThan(0)
  })

  it.each(LCU_GAME_FIXTURES)('loads %s game as queue %i', (fixtureName, queueId) => {
    const game = readLcuGameFixture(fixtureName)
    const summary = wrapLcuGame(game)
    const basic = toBasicInfo(summary)
    const participants = toParticipants(summary, basic)

    expect(game.queueId).toBe(queueId)
    expect(basic.queueId).toBe(queueId)
    expect(participants.length).toBe(game.participants.length)
  })

  it.each(LCU_GAME_FIXTURES)('loads %s timeline frames', (fixtureName) => {
    const game = readLcuGameFixture(fixtureName)
    const timeline = readLcuTimelineFixture(fixtureName)
    const frames = toFrames(wrapLcuTimeline(game.gameId, timeline))

    expect(frames.length).toBeGreaterThan(0)
  })
})
