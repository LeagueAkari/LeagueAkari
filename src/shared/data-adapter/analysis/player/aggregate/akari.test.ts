import { describe, expect, it } from 'vitest'

import type { AggregatedAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import type { SingleSummaryAnalysis } from '../types/single'
import { computeAggregatedAkariScore } from './akari'

const baseSummary: AggregatedAnalysis['summary'] = {
  avgChampionDamageRatioToTeamMax: 0,
  avgChampionDamageRatioToMax: 0,
  avgChampionDamagePercentageOfTeam: 0,
  avgChampionDamagePerMinute: 0,
  avgDamageTakenRatioToTeamMax: 0,
  avgDamageTakenRatioToMax: 0,
  avgDamageTakenPercentageOfTeam: 0,
  avgGoldRatioToTeamMax: 0,
  avgGoldRatioToMax: 0,
  avgGoldPercentageOfTeam: 0,
  avgCsRatioToTeamMax: 0,
  avgCsRatioToMax: 0,
  avgCsPercentageOfTeam: 0,
  avgCsPerMinute: 0,
  avgTowerDamageRatioToTeamMax: 0,
  avgTowerDamageRatioToMax: 0,
  avgTowerDamagePercentageOfTeam: 0,
  avgVisionScore: 0,
  avgVisionScorePercentageOfTeam: 0,
  avgDamageGoldEfficiency: 0,
  avgKillParticipation: 0,
  avgKillDamageEfficiency: 1,
  kills: 0,
  deaths: 0,
  assists: 0,
  avgKda: 1,
  kdaCv: 0,
  winRate: 0,
  avgSoloKills: null,
  avgEnemyMissingPings: null,
  avgPings: null
}

const baseSingleSummary: SingleSummaryAnalysis = {
  championDamageRatioToTeamMax: 0,
  championDamageRatioToExpectedContribution: 0,
  championDamageRatioToMax: 0,
  championDamagePercentageOfTeam: 0,
  championDamagePerMinute: 0,
  damageTakenRatioToTeamMax: 0,
  damageTakenRatioToExpectedContribution: 0,
  damageTakenRatioToMax: 0,
  damageTakenPercentageOfTeam: 0,
  goldRatioToTeamMax: 0,
  goldRatioToExpectedContribution: 0,
  goldRatioToMax: 0,
  goldPercentageOfTeam: 0,
  csRatioToTeamMax: 0,
  csRatioToMax: 0,
  csPercentageOfTeam: 0,
  csPerMinute: 0,
  towerDamageRatioToTeamMax: 0,
  towerDamageRatioToMax: 0,
  towerDamagePercentageOfTeam: 0,
  visionScorePercentageOfTeam: 0,
  visionScoreRatioToExpectedContribution: 0,
  totalDamageShieldedOnTeammatesRatioToTeamMax: null,
  totalDamageShieldedOnTeammatesRatioToMax: null,
  totalDamageShieldedOnTeammatesPercentageOfTeam: null,
  killDamageEfficiency: 1,
  kda: 1,
  win: false,
  killParticipation: 0,
  damageGoldEfficiency: 0
}

function createPreparedGame(gameId: number, summary: Partial<SingleSummaryAnalysis>): PreparedGame {
  return {
    gameId,
    single: {
      gameId,
      summary: {
        ...baseSingleSummary,
        ...summary
      },
      details: null,
      akariScore: {
        kdaScore: 0,
        winRateScore: 0,
        dmgScore: 0,
        dmgTakenScore: 0,
        csScore: 0,
        goldScore: 0,
        participationScore: 0,
        visionScore: 0,
        total: 0,
        outstanding: false,
        extraordinary: false
      }
    }
  } as PreparedGame
}

describe('computeAggregatedAkariScore', () => {
  it('scores average vision from expected contribution ratio with a 0.75 point cap at 200 percent', () => {
    const score = computeAggregatedAkariScore({
      count: 1,
      summary: baseSummary,
      games: [createPreparedGame(1, { visionScoreRatioToExpectedContribution: 2 })]
    })

    expect(score.visionScore).toBe(0.75)
    expect(score.total).toBeCloseTo(
      score.kdaScore +
        score.winRateScore +
        score.dmgScore +
        score.dmgTakenScore +
        score.csScore +
        score.goldScore +
        score.participationScore +
        score.visionScore
    )
  })

  it('does not award extra average vision score above 200 percent expected contribution', () => {
    const score = computeAggregatedAkariScore({
      count: 1,
      summary: baseSummary,
      games: [createPreparedGame(1, { visionScoreRatioToExpectedContribution: 3 })]
    })

    expect(score.visionScore).toBe(0.75)
  })

  it('averages expected contribution ratios before scoring', () => {
    const score = computeAggregatedAkariScore({
      count: 2,
      summary: baseSummary,
      games: [
        createPreparedGame(1, { championDamageRatioToExpectedContribution: 1 }),
        createPreparedGame(2, { championDamageRatioToExpectedContribution: 3 })
      ]
    })

    expect(score.dmgScore).toBe(1)
  })

  it('caps average KDA score at 0.35 points', () => {
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgKda: 4
        },
        games: []
      }).kdaScore
    ).toBe(0.3)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgKda: 9
        },
        games: []
      }).kdaScore
    ).toBe(0.35)
  })

  it('scores average gold at 150 percent expected contribution across a 0.75 point cap', () => {
    const score = computeAggregatedAkariScore({
      count: 1,
      summary: baseSummary,
      games: [createPreparedGame(1, { goldRatioToExpectedContribution: 1.5 })]
    })

    expect(score.goldScore).toBe(0.75)
  })

  it('maps win rate from 50 percent to 100 percent across a 0.25 point cap without a penalty below 50 percent', () => {
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          winRate: 0.49
        },
        games: []
      }).winRateScore
    ).toBe(0)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          winRate: 0.5
        },
        games: []
      }).winRateScore
    ).toBe(0)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          winRate: 0.75
        },
        games: []
      }).winRateScore
    ).toBe(0.125)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          winRate: 1
        },
        games: []
      }).winRateScore
    ).toBe(0.25)
  })

  it('maps average cs per minute linearly to a 0.75 point cap at 10 cs per minute', () => {
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgCsPerMinute: 0
        },
        games: []
      }).csScore
    ).toBe(0)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgCsPerMinute: 5
        },
        games: []
      }).csScore
    ).toBe(0.375)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgCsPerMinute: 10
        },
        games: []
      }).csScore
    ).toBe(0.75)
    expect(
      computeAggregatedAkariScore({
        count: 1,
        summary: {
          ...baseSummary,
          avgCsPerMinute: 12
        },
        games: []
      }).csScore
    ).toBe(0.75)
  })

  it('uses aggregate thresholds for performance tags', () => {
    const score = computeAggregatedAkariScore({
      count: 8,
      summary: {
        ...baseSummary,
        avgCsPerMinute: 10,
        avgKillParticipation: 1,
        winRate: 1
      },
      games: [
        createPreparedGame(1, {
          championDamageRatioToExpectedContribution: 2,
          damageTakenRatioToExpectedContribution: 2,
          goldRatioToExpectedContribution: 1.5,
          visionScoreRatioToExpectedContribution: 2
        })
      ]
    })

    expect(score.total).toBeCloseTo(5.15)
    expect(score.outstanding).toBe(true)
    expect(score.extraordinary).toBe(true)
  })
})
