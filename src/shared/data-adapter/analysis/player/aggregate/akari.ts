import {
  AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT,
  AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD,
  AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
  AGGREGATE_AKARI_OUTSTANDING_THRESHOLD,
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
import type { AggregatedAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import type { AkariScore } from '../types/single'
import { avgOrZero } from '../utils/math'

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

export function computeAggregatedAkariScore(analysis: {
  count: number
  summary: AggregatedAnalysis['summary']
  games: PreparedGame[]
}): AkariScore {
  const summaries = analysis.games.map((game) => game.single.summary)
  const kdaScore = scoreKda(analysis.summary.avgKda)
  const winRateScore = scoreWinRate(analysis.summary.winRate)
  const dmgScore = scoreExpectedContribution(
    avgOrZero(summaries.map((summary) => summary.championDamageRatioToExpectedContribution)),
    AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_DAMAGE_WEIGHT
  )
  const dmgTakenScore = scoreExpectedContribution(
    avgOrZero(summaries.map((summary) => summary.damageTakenRatioToExpectedContribution)),
    AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_DAMAGE_TAKEN_WEIGHT
  )
  const csScore = scoreCsPerMinute(analysis.summary.avgCsPerMinute)
  const goldScore = scoreExpectedContribution(
    avgOrZero(summaries.map((summary) => summary.goldRatioToExpectedContribution)),
    AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
    AKARI_GOLD_WEIGHT
  )
  const participationScore = scoreParticipation(analysis.summary.avgKillParticipation)
  const visionScore =
    (clamp(
      avgOrZero(summaries.map((summary) => summary.visionScoreRatioToExpectedContribution)),
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
    outstanding:
      total >= AGGREGATE_AKARI_OUTSTANDING_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
    extraordinary:
      total >= AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT
  }
}
