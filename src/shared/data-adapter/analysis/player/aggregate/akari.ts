import {
  AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT,
  AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD,
  AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
  AGGREGATE_AKARI_OUTSTANDING_THRESHOLD,
  AKARI_CS_MAX_MULTIPLIER,
  AKARI_CS_MIN_MULTIPLIER,
  AKARI_CS_SCALING_FACTOR,
  AKARI_DAMAGE_TAKEN_WEIGHT,
  AKARI_DAMAGE_WEIGHT,
  AKARI_GOLD_WEIGHT,
  AKARI_KDA_WEIGHT,
  AKARI_PARTICIPATION_WEIGHT,
  AKARI_WIN_RATE_BASELINE,
  AKARI_WIN_RATE_WEIGHT
} from '../constants'
import type { AggregatedAnalysis } from '../types/aggregated'
import type { AkariScore } from '../types/single'

function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

export function computeAggregatedAkariScore(analysis: {
  count: number
  summary: AggregatedAnalysis['summary']
}): AkariScore {
  const kdaScore = Math.sqrt(analysis.summary.avgKda) * AKARI_KDA_WEIGHT
  const winRateScore = (analysis.summary.winRate - AKARI_WIN_RATE_BASELINE) * AKARI_WIN_RATE_WEIGHT
  const dmgScore = analysis.summary.avgChampionDamageRatioToTeamMax * AKARI_DAMAGE_WEIGHT
  const dmgTakenScore = analysis.summary.avgDamageTakenRatioToTeamMax * AKARI_DAMAGE_TAKEN_WEIGHT
  const csScore =
    analysis.summary.avgCsPerMinute *
    clamp(
      AKARI_CS_SCALING_FACTOR * analysis.summary.avgCsPerMinute,
      AKARI_CS_MIN_MULTIPLIER,
      AKARI_CS_MAX_MULTIPLIER
    )
  const goldScore = analysis.summary.avgGoldRatioToTeamMax * AKARI_GOLD_WEIGHT
  const participationScore = analysis.summary.avgKillParticipation * AKARI_PARTICIPATION_WEIGHT

  const total =
    kdaScore + winRateScore + dmgScore + dmgTakenScore + csScore + goldScore + participationScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    csScore,
    goldScore,
    participationScore,
    total,
    outstanding:
      total >= AGGREGATE_AKARI_OUTSTANDING_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_OUTSTANDING_MIN_COUNT,
    extraordinary:
      total >= AGGREGATE_AKARI_EXTRAORDINARY_THRESHOLD &&
      analysis.count >= AGGREGATE_AKARI_EXTRAORDINARY_MIN_COUNT
  }
}
