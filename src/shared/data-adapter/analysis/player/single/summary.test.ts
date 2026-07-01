import { describe, expect, it } from 'vitest'

import type { MatchBasicInfo } from '../../../match-history/match-basic'
import type { MatchParticipant } from '../../../match-history/participants'
import { computeSingleSummary } from './summary'

function createParticipant(overrides: Partial<MatchParticipant>): MatchParticipant {
  return {
    totalDamageDealtToChampions: 0,
    totalDamageTaken: 0,
    goldEarned: 0,
    cs: 0,
    totalDamageToTowers: 0,
    totalDamageShieldedOnTeammates: null,
    kills: 0,
    deaths: 0,
    assists: 0,
    kda: 0,
    winResult: 'loss',
    visionScore: 0,
    ...overrides
  } as MatchParticipant
}

describe('computeSingleSummary', () => {
  it('computes expected contribution ratios from team size', () => {
    const basic = {
      gameDuration: 1800
    } as MatchBasicInfo
    const participant = createParticipant({
      totalDamageDealtToChampions: 400,
      totalDamageTaken: 400,
      goldEarned: 300,
      visionScore: 40
    })
    const teamParticipants = [
      participant,
      createParticipant({
        totalDamageDealtToChampions: 150,
        totalDamageTaken: 150,
        goldEarned: 175,
        visionScore: 15
      }),
      createParticipant({
        totalDamageDealtToChampions: 150,
        totalDamageTaken: 150,
        goldEarned: 175,
        visionScore: 15
      }),
      createParticipant({
        totalDamageDealtToChampions: 150,
        totalDamageTaken: 150,
        goldEarned: 175,
        visionScore: 15
      }),
      createParticipant({
        totalDamageDealtToChampions: 150,
        totalDamageTaken: 150,
        goldEarned: 175,
        visionScore: 15
      })
    ]

    const summary = computeSingleSummary(basic, participant, teamParticipants, teamParticipants)

    expect(summary.championDamageRatioToExpectedContribution).toBeCloseTo(2)
    expect(summary.damageTakenRatioToExpectedContribution).toBeCloseTo(2)
    expect(summary.goldRatioToExpectedContribution).toBeCloseTo(1.5)
    expect(summary.visionScoreRatioToExpectedContribution).toBeCloseTo(2)
  })

  it('uses the actual team size for expected contribution ratios', () => {
    const basic = {
      gameDuration: 1800
    } as MatchBasicInfo
    const participant = createParticipant({
      totalDamageDealtToChampions: 500,
      totalDamageTaken: 500,
      goldEarned: 500,
      visionScore: 50
    })
    const teamParticipants = [
      participant,
      createParticipant({
        totalDamageDealtToChampions: 200,
        totalDamageTaken: 200,
        goldEarned: 200,
        visionScore: 20
      }),
      createParticipant({
        totalDamageDealtToChampions: 200,
        totalDamageTaken: 200,
        goldEarned: 200,
        visionScore: 20
      }),
      createParticipant({
        totalDamageDealtToChampions: 100,
        totalDamageTaken: 100,
        goldEarned: 100,
        visionScore: 10
      })
    ]

    const summary = computeSingleSummary(basic, participant, teamParticipants, teamParticipants)

    expect(summary.championDamageRatioToExpectedContribution).toBeCloseTo(2)
    expect(summary.damageTakenRatioToExpectedContribution).toBeCloseTo(2)
    expect(summary.goldRatioToExpectedContribution).toBeCloseTo(2)
    expect(summary.visionScoreRatioToExpectedContribution).toBeCloseTo(2)
  })

  it('does not score expected contribution ratios for single-player teams', () => {
    const basic = {
      gameDuration: 1800
    } as MatchBasicInfo
    const participant = createParticipant({
      totalDamageDealtToChampions: 1000,
      totalDamageTaken: 1000,
      goldEarned: 1000,
      visionScore: 100
    })

    const summary = computeSingleSummary(basic, participant, [participant], [participant])

    expect(summary.championDamageRatioToExpectedContribution).toBe(0)
    expect(summary.damageTakenRatioToExpectedContribution).toBe(0)
    expect(summary.goldRatioToExpectedContribution).toBe(0)
    expect(summary.visionScoreRatioToExpectedContribution).toBe(0)
  })

  it('computes the player vision score share within the team', () => {
    const basic = {
      gameDuration: 1800
    } as MatchBasicInfo
    const participant = createParticipant({
      totalDamageDealtToChampions: 12000,
      totalDamageTaken: 9000,
      goldEarned: 11000,
      cs: 180,
      kills: 5,
      assists: 7,
      kda: 4,
      visionScore: 24
    })
    const teamParticipants = [
      participant,
      createParticipant({ visionScore: 36 }),
      createParticipant({ visionScore: 0 })
    ]

    const summary = computeSingleSummary(basic, participant, teamParticipants, teamParticipants)

    expect(summary.visionScorePercentageOfTeam).toBeCloseTo(0.4)
  })

  it('treats missing vision scores as 0', () => {
    const basic = {
      gameDuration: 1800
    } as MatchBasicInfo
    const participant = createParticipant({
      visionScore: undefined as unknown as number
    })
    const teamParticipants = [participant, createParticipant({ visionScore: 20 })]

    const summary = computeSingleSummary(basic, participant, teamParticipants, teamParticipants)

    expect(summary.visionScorePercentageOfTeam).toBe(0)
  })
})
