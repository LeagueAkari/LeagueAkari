import { describe, expect, it } from 'vitest'

import type { SingleSummaryAnalysis } from '../types/single'
import { computeSingleAkariScore } from './akari'

const baseSummary: SingleSummaryAnalysis = {
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

describe('computeSingleAkariScore', () => {
  it('scores vision from expected contribution ratio with a 0.75 point cap at 200 percent', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      visionScoreRatioToExpectedContribution: 2
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

  it('does not award extra vision score above 200 percent expected contribution', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      visionScoreRatioToExpectedContribution: 3
    })

    expect(score.visionScore).toBe(0.75)
  })

  it('uses lower non-vision weights to balance the added vision metric', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      kda: 4,
      win: true,
      championDamageRatioToExpectedContribution: 2,
      damageTakenRatioToExpectedContribution: 2,
      csPerMinute: 10,
      goldRatioToExpectedContribution: 1.5,
      killParticipation: 1,
      visionScoreRatioToExpectedContribution: 2
    })

    expect(score).toMatchObject({
      kdaScore: 0.3,
      winRateScore: 0.25,
      dmgScore: 1,
      dmgTakenScore: 0.75,
      csScore: 0.75,
      goldScore: 0.75,
      participationScore: 0.75,
      visionScore: 0.75
    })
    expect(score.total).toBeCloseTo(5.3)
  })

  it('caps KDA score at 0.35 points', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 4
      }).kdaScore
    ).toBe(0.3)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 9
      }).kdaScore
    ).toBe(0.35)
  })

  it('scores wins without penalizing losses', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        win: false
      }).winRateScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        win: true
      }).winRateScore
    ).toBe(0.25)
  })

  it('maps cs per minute linearly to a 0.75 point cap at 10 cs per minute', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 0
      }).csScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 5
      }).csScore
    ).toBe(0.375)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 10
      }).csScore
    ).toBe(0.75)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 12
      }).csScore
    ).toBe(0.75)
  })

  it('scores expected contribution from 0 percent to the target contribution ratio', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        championDamageRatioToExpectedContribution: 1
      }).dmgScore
    ).toBe(0.5)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        championDamageRatioToExpectedContribution: 2
      }).dmgScore
    ).toBe(1)
  })

  it('scores gold at 150 percent expected contribution', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      goldRatioToExpectedContribution: 1.5
    })

    expect(score.goldScore).toBe(0.75)
  })

  it('maps kill participation from 30 percent to 100 percent across a 0.75 point cap', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        killParticipation: 0.29
      }).participationScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        killParticipation: 0.65
      }).participationScore
    ).toBeCloseTo(0.375)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        killParticipation: 1
      }).participationScore
    ).toBe(0.75)
  })
})
