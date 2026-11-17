import { wrapSgpSummary } from '@shared/data-adapter/analysis/player/test-utils/fixtures'
import { readSgpMatchHistoryQueryFixture } from '@shared/test-fixtures/api'
import type { SgpGameSummaryLol } from '@shared/types/sgp/match-history'
import { describe, expect, it } from 'vitest'

import {
  type SelfImprovementMatch,
  buildSelfImprovementBuckets,
  buildSelfImprovementInsights,
  buildSelfImprovementMovingAverage,
  compareRecentSelfImprovementMatches,
  evaluateSelfImprovementEconomyStanding,
  extractSelfImprovementMatch,
  sortSelfImprovementMatchesByTime,
  summarizeSelfImprovementMatches
} from './self-improvement-metrics'

function createMatch(overrides: Partial<SelfImprovementMatch> = {}): SelfImprovementMatch {
  return {
    gameId: 1,
    gameCreation: 1_700_000_000_000,
    gameDuration: 1800,
    queueId: 420,
    gameMode: 'CLASSIC',
    mapId: 11,
    championId: 1,
    position: 'MIDDLE',
    win: true,
    kills: 5,
    deaths: 2,
    assists: 5,
    kda: 5,
    cs: 180,
    csPerMinute: 6,
    gold: 12_000,
    goldPerMinute: 400,
    visionScore: 20,
    visionScorePerMinute: 0.7,
    wardsPlaced: 10,
    wardsKilled: 3,
    visionWardsBoughtInGame: 2,
    damageToChampions: 20_000,
    damagePerMinute: 700,
    damageGoldEfficiency: 20_000 / 12_000,
    damageShare: 0.4,
    teamDamageToChampions: 50_000,
    ...overrides
  }
}

function readRankedFixture(): SgpGameSummaryLol {
  const fixture = readSgpMatchHistoryQueryFixture('ranked')
  return fixture.games[0]
}

const RANKED_PUUID = 'e51ec234-db07-587a-95e9-771145a7b620'

describe('extractSelfImprovementMatch', () => {
  it('extracts per-match economy metrics from an SGP summary', () => {
    const game = readRankedFixture()
    const match = extractSelfImprovementMatch(wrapSgpSummary(game), RANKED_PUUID)

    expect(match).not.toBeNull()

    const durationMinutes = game.json.gameDuration / 60

    expect(match).toMatchObject({
      gameId: game.json.gameId,
      queueId: 420,
      championId: game.json.participants.find((p) => p.puuid === RANKED_PUUID)!.championId,
      win: true,
      cs: 182,
      kills: 13,
      deaths: 7,
      assists: 7,
      gold: 15_232,
      visionScore: 20,
      wardsPlaced: 12,
      wardsKilled: 1,
      visionWardsBoughtInGame: 2
    })

    expect(match!.csPerMinute).toBeCloseTo(182 / durationMinutes, 5)
    expect(match!.goldPerMinute).toBeCloseTo(15_232 / durationMinutes, 5)
    expect(match!.damagePerMinute).toBeCloseTo(33_851 / durationMinutes, 5)
    expect(match!.damageGoldEfficiency).toBeCloseTo(33_851 / 15_232, 5)
    expect(match!.damageShare).toBeCloseTo(33_851 / 125_358, 5)
    expect(match!.teamDamageToChampions).toBe(125_358)
    expect(match!.kda).toBeCloseTo(20 / 7, 5)
  })

  it('rejects aborted games, bot games, and unknown players', () => {
    const game = readRankedFixture()

    const aborted = structuredClone(game)
    aborted.json.endOfGameResult = 'Abort_TooFewPlayers'
    expect(extractSelfImprovementMatch(wrapSgpSummary(aborted), RANKED_PUUID)).toBeNull()

    const botGame = structuredClone(game)
    botGame.json.queueId = 830
    expect(extractSelfImprovementMatch(wrapSgpSummary(botGame), RANKED_PUUID)).toBeNull()

    expect(extractSelfImprovementMatch(wrapSgpSummary(game), 'missing-puuid')).toBeNull()
  })
})

describe('sortSelfImprovementMatchesByTime', () => {
  it('sorts oldest first without mutating the input', () => {
    const newest = createMatch({ gameId: 3, gameCreation: 3000 })
    const oldest = createMatch({ gameId: 1, gameCreation: 1000 })
    const middle = createMatch({ gameId: 2, gameCreation: 2000 })
    const input = [newest, oldest, middle]

    expect(sortSelfImprovementMatchesByTime(input).map((m) => m.gameId)).toEqual([1, 2, 3])
    expect(input.map((m) => m.gameId)).toEqual([3, 1, 2])
  })
})

describe('summarizeSelfImprovementMatches', () => {
  it('weights per-minute metrics by total play time', () => {
    const matches = [
      createMatch({
        gameId: 1,
        gameDuration: 600,
        cs: 60,
        gold: 6000,
        visionScore: 12,
        damageToChampions: 10_000,
        kills: 3,
        deaths: 2,
        assists: 5,
        win: true
      }),
      createMatch({
        gameId: 2,
        gameDuration: 1200,
        cs: 180,
        gold: 12_000,
        visionScore: 24,
        damageToChampions: 20_000,
        kills: 1,
        deaths: 3,
        assists: 4,
        win: false
      })
    ]

    const summary = summarizeSelfImprovementMatches(matches)

    expect(summary.count).toBe(2)
    expect(summary.wins).toBe(1)
    expect(summary.winRate).toBe(0.5)
    expect(summary.totalMinutes).toBe(30)
    expect(summary.csPerMinute).toBeCloseTo(240 / 30, 5)
    expect(summary.goldPerMinute).toBeCloseTo(18_000 / 30, 5)
    expect(summary.visionScorePerMinute).toBeCloseTo(36 / 30, 5)
    expect(summary.damagePerMinute).toBeCloseTo(30_000 / 30, 5)
    expect(summary.kda).toBeCloseTo((3 + 1 + 5 + 4) / (2 + 3), 5)
  })

  it('returns an empty summary for no matches', () => {
    const summary = summarizeSelfImprovementMatches([])

    expect(summary.count).toBe(0)
    expect(summary.winRate).toBe(0)
    expect(summary.csPerMinute).toBe(0)
  })
})

describe('compareRecentSelfImprovementMatches', () => {
  it('compares the latest window with the previous equal window', () => {
    const matches = Array.from({ length: 20 }, (_, index) => {
      const isRecent = index >= 10

      return createMatch({
        gameId: index + 1,
        gameCreation: (index + 1) * 1000,
        gameDuration: 1800,
        cs: isRecent ? 240 : 180,
        gold: isRecent ? 13_500 : 12_000,
        kills: isRecent ? 4 : 3,
        deaths: 1,
        assists: 0,
        win: isRecent
      })
    })

    const comparison = compareRecentSelfImprovementMatches(matches, 10)

    expect(comparison.recent.count).toBe(10)
    expect(comparison.previous.count).toBe(10)
    expect(comparison.recent.csPerMinute).toBeCloseTo(8, 5)
    expect(comparison.previous.csPerMinute).toBeCloseTo(6, 5)
    expect(comparison.delta.csPerMinute).toBeCloseTo(2, 5)
    expect(comparison.delta.goldPerMinute).toBeCloseTo(50, 5)
    expect(comparison.delta.kda).toBeCloseTo(1, 5)
    expect(comparison.delta.winRate).toBeCloseTo(1, 5)
  })

  it('returns null deltas when there is no previous window', () => {
    const comparison = compareRecentSelfImprovementMatches([createMatch()], 10)

    expect(comparison.recent.count).toBe(1)
    expect(comparison.previous.count).toBe(0)
    expect(comparison.delta.csPerMinute).toBeNull()
    expect(comparison.delta.winRate).toBeNull()
  })
})

describe('buildSelfImprovementBuckets', () => {
  it('groups matches into fixed-size buckets with the newest bucket first', () => {
    const matches = Array.from({ length: 12 }, (_, index) =>
      createMatch({
        gameId: index + 1,
        gameCreation: (index + 1) * 1000,
        csPerMinute: index + 1
      })
    )

    const buckets = buildSelfImprovementBuckets(matches, 5)

    expect(buckets).toHaveLength(3)
    expect(buckets[0].summary.count).toBe(5)
    expect(buckets[0].startGameCreation).toBe(8000)
    expect(buckets[0].endGameCreation).toBe(12_000)
    expect(buckets[1].startGameCreation).toBe(3000)
    expect(buckets[1].endGameCreation).toBe(7000)
    expect(buckets[2].summary.count).toBe(2)
    expect(buckets[2].startGameCreation).toBe(1000)
  })
})

describe('evaluateSelfImprovementEconomyStanding', () => {
  it('ranks the latest window against all historical windows', () => {
    const matches = Array.from({ length: 30 }, (_, index) =>
      createMatch({
        gameId: index + 1,
        gameCreation: (index + 1) * 1000,
        gameDuration: 1800,
        gold: index < 10 ? 12_000 : index < 20 ? 13_500 : 12_900
      })
    )

    const standing = evaluateSelfImprovementEconomyStanding(
      buildSelfImprovementBuckets(matches, 10)
    )

    expect(standing).not.toBeNull()
    expect(standing).toMatchObject({
      latestGoldPerMinute: 430,
      bestGoldPerMinute: 450,
      worstGoldPerMinute: 400,
      gapToBest: 20,
      latestRank: 2,
      bucketCount: 3
    })
  })

  it('returns null without buckets', () => {
    expect(evaluateSelfImprovementEconomyStanding([])).toBeNull()
  })
})

describe('buildSelfImprovementMovingAverage', () => {
  it('only starts producing values once the window is full', () => {
    expect(buildSelfImprovementMovingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4])
  })

  it('returns nulls for invalid window sizes', () => {
    expect(buildSelfImprovementMovingAverage([1, 2, 3], 0)).toEqual([null, null, null])
  })
})

describe('buildSelfImprovementInsights', () => {
  const createComparison = (
    recent: { cs: number; gold: number; kills: number; vision: number; win: boolean },
    previous: { cs: number; gold: number; kills: number; vision: number; win: boolean }
  ) => {
    const matches = Array.from({ length: 20 }, (_, index) => {
      const isRecent = index >= 10
      const source = isRecent ? recent : previous

      return createMatch({
        gameId: index + 1,
        gameCreation: (index + 1) * 1000,
        cs: source.cs,
        gold: source.gold,
        kills: source.kills,
        deaths: 2,
        assists: 0,
        visionScore: source.vision,
        win: source.win
      })
    })

    return compareRecentSelfImprovementMatches(matches, 10)
  }

  it('reports declines as warnings', () => {
    const insights = buildSelfImprovementInsights(
      createComparison(
        { cs: 120, gold: 9000, kills: 2, vision: 8, win: false },
        { cs: 180, gold: 12_000, kills: 4, vision: 20, win: true }
      )
    )

    expect(insights.map((insight) => insight.code)).toEqual(
      expect.arrayContaining(['farmingDown', 'economyDown', 'combatDown', 'visionDown'])
    )
    expect(insights.every((insight) => insight.tone === 'warning')).toBe(true)
    expect(insights.length).toBeLessThanOrEqual(4)
  })

  it('reports improvements as positive insights', () => {
    const insights = buildSelfImprovementInsights(
      createComparison(
        { cs: 180, gold: 12_000, kills: 4, vision: 20, win: true },
        { cs: 120, gold: 9000, kills: 2, vision: 8, win: false }
      )
    )

    expect(insights.map((insight) => insight.code)).toEqual(
      expect.arrayContaining(['farmingUp', 'economyUp', 'combatUp', 'visionUp'])
    )
    expect(insights.every((insight) => insight.tone === 'positive')).toBe(true)
  })

  it('returns a stable insight when changes stay under the thresholds', () => {
    const insights = buildSelfImprovementInsights(
      createComparison(
        { cs: 180, gold: 12_000, kills: 4, vision: 20, win: true },
        { cs: 178, gold: 11_950, kills: 4, vision: 20, win: true }
      )
    )

    expect(insights).toEqual([{ code: 'stable', tone: 'neutral', value: 0 }])
  })

  it('returns no insights without a previous window', () => {
    const comparison = compareRecentSelfImprovementMatches([createMatch()], 10)

    expect(buildSelfImprovementInsights(comparison)).toEqual([])
  })
})
