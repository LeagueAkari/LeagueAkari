import {
  AKARI_CS_FULL_SCORE_PER_MINUTE,
  AKARI_CS_MAX_SCORE,
  AKARI_DAMAGE_TAKEN_WEIGHT,
  AKARI_DAMAGE_WEIGHT,
  AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
  AKARI_GOLD_WEIGHT,
  AKARI_KDA_MAX_SCORE,
  AKARI_KDA_WEIGHT,
  AKARI_PARTICIPATION_MIN_SHARE,
  AKARI_PARTICIPATION_WEIGHT,
  AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
  AKARI_VISION_MAX_SCORE,
  AKARI_WIN_RATE_BASELINE,
  AKARI_WIN_RATE_WEIGHT
} from '../constants'
import type { AkariScore, SingleAnalysis } from '../types/single'

function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

function scoreExpectedContribution(ratio: number, fullScoreRatio: number, maxScore: number) {
  return (clamp(ratio, 0, fullScoreRatio) / fullScoreRatio) * maxScore
}

function scoreKda(kda: number) {
  return clamp(Math.sqrt(kda) * AKARI_KDA_WEIGHT, 0, AKARI_KDA_MAX_SCORE)
}

function scoreWinRate(winRate: number) {
  return (
    ((clamp(winRate, AKARI_WIN_RATE_BASELINE, 1) - AKARI_WIN_RATE_BASELINE) /
      (1 - AKARI_WIN_RATE_BASELINE)) *
    AKARI_WIN_RATE_WEIGHT
  )
}

function scoreCsPerMinute(csPerMinute: number) {
  return (
    (clamp(csPerMinute, 0, AKARI_CS_FULL_SCORE_PER_MINUTE) / AKARI_CS_FULL_SCORE_PER_MINUTE) *
    AKARI_CS_MAX_SCORE
  )
}

function scoreParticipation(killParticipation: number) {
  return (
    ((clamp(killParticipation, AKARI_PARTICIPATION_MIN_SHARE, 1) - AKARI_PARTICIPATION_MIN_SHARE) /
      (1 - AKARI_PARTICIPATION_MIN_SHARE)) *
    AKARI_PARTICIPATION_WEIGHT
  )
}

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
  const csScore = scoreCsPerMinute(summary.csPerMinute)
  const goldScore = scoreExpectedContribution(
    summary.goldRatioToExpectedContribution,
    AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_GOLD_WEIGHT
  )
  const participationScore = scoreParticipation(summary.killParticipation)
  const visionScore =
    (clamp(
      summary.visionScoreRatioToExpectedContribution,
      0,
      AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO
    ) /
      AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO) *
    AKARI_VISION_MAX_SCORE

  const total =
    kdaScore +
    winRateScore +
    dmgScore +
    dmgTakenScore +
    csScore +
    goldScore +
    participationScore +
    visionScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    csScore,
    goldScore,
    participationScore,
    visionScore,
    total,
    outstanding: false,
    extraordinary: false
  }
}
