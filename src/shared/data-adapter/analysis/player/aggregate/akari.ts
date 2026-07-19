import {
  AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT,
  AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD,
  AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
  AGGREGATE_AKARI_OUTSTANDING_THRESHOLD,
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
import type { AggregatedAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'
import type { AkariScore } from '../types/single'
import { avgOrZero } from '../utils/math'

export function computeAggregatedAkariScore(analysis: {
  count: number
  summary: AggregatedAnalysis['summary']
  games: PreparedGame[]
}): AkariScore {
  const summaries = analysis.games.map((game) => game.single.summary)
  const kdaScore = scoreKda(analysis.summary.avgKda)
  const winRateScore = scoreWinRate(analysis.summary.winRate)
  const dmgScore = avgOrZero(
    summaries.map((summary) =>
      scoreExpectedContribution(
        summary.championDamageRatioToExpectedContribution,
        AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
        AKARI_DAMAGE_WEIGHT
      )
    )
  )
  const dmgTakenScore = avgOrZero(
    summaries.map((summary) =>
      scoreExpectedContribution(
        summary.damageTakenRatioToExpectedContribution,
        AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
        AKARI_DAMAGE_TAKEN_WEIGHT
      )
    )
  )
  const healingScore = avgOrZero(
    summaries.map((summary) =>
      scoreHealing(summary.healingRatioToTeamAverageDamageTaken, summary.teamParticipantCount)
    )
  )
  const csScore = avgOrZero(summaries.map((summary) => scoreCsPerMinute(summary.csPerMinute)))
  const goldScore = avgOrZero(
    summaries.map((summary) =>
      scoreExpectedContribution(
        summary.goldRatioToExpectedContribution,
        AKARI_GOLD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
        AKARI_GOLD_WEIGHT
      )
    )
  )
  const participationScore = avgOrZero(
    summaries.map((summary) => scoreParticipation(summary.killParticipation))
  )
  const visionScore = avgOrZero(
    summaries.map((summary) =>
      scoreExpectedContribution(
        summary.visionScoreRatioToExpectedContribution,
        AKARI_STANDARD_EXPECTED_CONTRIBUTION_FULL_SCORE_RATIO,
        AKARI_VISION_MAX_SCORE
      )
    )
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
    outstanding:
      total >= AGGREGATE_AKARI_OUTSTANDING_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
    extraordinary:
      total >= AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT
  }
}
