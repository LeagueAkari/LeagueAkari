import { describe, expect, it } from 'vitest'

import {
  readApiFixtureManifest,
  readLcuMatchHistoryFixture,
  readLcuMatchHistoryGameFixture,
  readLcuMatchHistoryTimelineFixture,
  readSgpMatchHistoryQueryFixture
} from '.'

describe('API fixture database', () => {
  it('documents the Tencent capture environment separately from raw responses', () => {
    const manifest = readApiFixtureManifest()

    expect(manifest.id).toBe('2026-05-16-tencent-hn10')
    expect(manifest.environment.server).toBe('TENCENT_HN10')
    expect(manifest.environment.regionFamily).toBe('tencent')
    expect(manifest.sgp.matchHistoryQuery.missingQueuesSearched).toEqual([490, 1900])
  })

  it('keeps SGP match-history-query files as raw API responses', () => {
    const manifest = readApiFixtureManifest()

    for (const fixtureName of manifest.sgp.matchHistoryQuery.fixtures) {
      expect(Object.keys(readSgpMatchHistoryQueryFixture(fixtureName))).toEqual(['games'])
    }
  })

  it('keeps LCU match-history files as raw API responses', () => {
    const manifest = readApiFixtureManifest()
    const page = readLcuMatchHistoryFixture()

    expect(Object.keys(page).sort()).toEqual(['accountId', 'games', 'platformId'])

    for (const fixtureName of manifest.lcu.matchHistory.gameFixtures) {
      const game = readLcuMatchHistoryGameFixture(fixtureName)
      const expectedQueueId = Number(fixtureName.replace('q_', ''))

      expect(game.queueId).toBe(expectedQueueId)
    }

    for (const fixtureName of manifest.lcu.matchHistory.timelineFixtures) {
      const timeline = readLcuMatchHistoryTimelineFixture(fixtureName)

      expect(timeline.frames.length).toBeGreaterThan(0)
    }
  })
})
