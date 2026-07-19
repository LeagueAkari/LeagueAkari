import {
  AKARI_DAMAGE_TAKEN_WEIGHT,
  AKARI_DAMAGE_WEIGHT,
  AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
  AKARI_GOLD_WEIGHT,
  AKARI_MAX_SCORE,
  AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
  AKARI_VISION_MAX_SCORE
} from '../constants'
import {
  scoreCsPerMinute,
  scoreExpectedContribution,
  scoreHealing,
  scoreKda,
  scoreParticipation,
  scoreWinRate
} from '../scoring'
import type { AkariScore, SingleAnalysis } from '../types/single'

export function computeSingleAkariScore(summary: SingleAnalysis['summary']): AkariScore {
  const kdaScore = scoreKda(summary.kda)
  const winRateScore = scoreWinRate(summary.win ? 1 : 0)
  const dmgScore = scoreExpectedContribution(
    summary.championDamageRatioToExpectedContribution,
    AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_DAMAGE_WEIGHT
  )
  const dmgTakenScore = scoreExpectedContribution(
    summary.damageTakenRatioToExpectedContribution,
    AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_DAMAGE_TAKEN_WEIGHT
  )
  const healingScore = scoreHealing(
    summary.healingRatioToTeamAverageDamageTaken,
    summary.teamParticipantCount
  )
  const csScore = scoreCsPerMinute(summary.csPerMinute)
  const goldScore = scoreExpectedContribution(
    summary.goldRatioToExpectedContribution,
    AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_GOLD_WEIGHT
  )
  const participationScore = scoreParticipation(summary.killParticipation)
  const visionScore = scoreExpectedContribution(
    summary.visionScoreRatioToExpectedContribution,
    AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_VISION_MAX_SCORE
  )

  const total =
    kdaScore +
    winRateScore +
    dmgScore +
    dmgTakenScore +
    healingScore +
    csScore +
    goldScore +
    participationScore +
    visionScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    healingScore,
    csScore,
    goldScore,
    participationScore,
    visionScore,
    total,
    maxScore: AKARI_MAX_SCORE,
    outstanding: false,
    extraordinary: false
  }
}
