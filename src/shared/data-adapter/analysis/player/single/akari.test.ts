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
  healingRatioToTeamAverageDamageTaken: 0,
  teamParticipantCount: 5,
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
  it('scores vision only above expected contribution with a 2 point cap at 200 percent', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        visionScoreRatioToExpectedContribution: 1
      }).visionScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        visionScoreRatioToExpectedContribution: 1.5
      }).visionScore
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        visionScoreRatioToExpectedContribution: 2
      }).visionScore
    ).toBe(2)
  })

  it('does not award extra vision score above 200 percent expected contribution', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      visionScoreRatioToExpectedContribution: 3
    })

    expect(score.visionScore).toBe(2)
  })

  it('uses the 17 point scale at every component cap', () => {
    const score = computeSingleAkariScore({
      ...baseSummary,
      kda: 9,
      win: true,
      championDamageRatioToExpectedContribution: 2,
      damageTakenRatioToExpectedContribution: 2,
      healingRatioToTeamAverageDamageTaken: 1.4,
      csPerMinute: 10,
      goldRatioToExpectedContribution: 1.5,
      killParticipation: 1,
      visionScoreRatioToExpectedContribution: 2
    })

    expect(score).toMatchObject({
      kdaScore: 1,
      winRateScore: 1,
      dmgScore: 3,
      dmgTakenScore: 2,
      healingScore: 2,
      csScore: 2,
      goldScore: 2,
      participationScore: 2,
      visionScore: 2,
      maxScore: 17
    })
    expect(score.total).toBeCloseTo(17)
  })

  it('maps multiplayer healing from 20 to 140 percent of team-average damage taken', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        healingRatioToTeamAverageDamageTaken: 0.2
      }).healingScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        healingRatioToTeamAverageDamageTaken: 0.8
      }).healingScore
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        healingRatioToTeamAverageDamageTaken: 1.4
      }).healingScore
    ).toBe(2)
  })

  it('awards full healing score at 100 percent for single-player teams', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        teamParticipantCount: 1,
        healingRatioToTeamAverageDamageTaken: 0.6
      }).healingScore
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        teamParticipantCount: 1,
        healingRatioToTeamAverageDamageTaken: 1
      }).healingScore
    ).toBe(2)
  })

  it('scores KDA only above 2 with diminishing returns and a 1 point cap', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 2
      }).kdaScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 3
      }).kdaScore
    ).toBeCloseTo(3 / 7)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 4
      }).kdaScore
    ).toBeCloseTo((Math.sqrt(2) * 3) / 7)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        kda: 8
      }).kdaScore
    ).toBe(1)
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
    ).toBe(1)
  })

  it('maps cs per minute from 5 to 10 across a 2 point cap', () => {
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
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 7.5
      }).csScore
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 10
      }).csScore
    ).toBe(2)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        csPerMinute: 12
      }).csScore
    ).toBe(2)
  })

  it('scores expected contribution only above the baseline ratio', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        championDamageRatioToExpectedContribution: 1
      }).dmgScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        championDamageRatioToExpectedContribution: 1.5
      }).dmgScore
    ).toBeCloseTo(1.5)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        championDamageRatioToExpectedContribution: 2
      }).dmgScore
    ).toBe(3)
  })

  it('scores gold from expected contribution to 150 percent', () => {
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        goldRatioToExpectedContribution: 1
      }).goldScore
    ).toBe(0)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        goldRatioToExpectedContribution: 1.25
      }).goldScore
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        goldRatioToExpectedContribution: 1.5
      }).goldScore
    ).toBe(2)
  })

  it('maps kill participation from 30 percent to 100 percent across a 2 point cap', () => {
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
    ).toBeCloseTo(1)
    expect(
      computeSingleAkariScore({
        ...baseSummary,
        killParticipation: 1
      }).participationScore
    ).toBe(2)
  })
})
