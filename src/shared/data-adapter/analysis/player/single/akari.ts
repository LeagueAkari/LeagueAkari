import {
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
import type { AkariScore, SingleAnalysis } from '../types/single'

function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

export function computeSingleAkariScore(summary: SingleAnalysis['summary']): AkariScore {
  const kdaScore = Math.sqrt(summary.kda) * AKARI_KDA_WEIGHT
  const winRateScore = ((summary.win ? 1 : 0) - AKARI_WIN_RATE_BASELINE) * AKARI_WIN_RATE_WEIGHT
  const dmgScore = summary.championDamageRatioToTeamMax * AKARI_DAMAGE_WEIGHT
  const dmgTakenScore = summary.damageTakenRatioToTeamMax * AKARI_DAMAGE_TAKEN_WEIGHT
  const csScore =
    summary.csPerMinute *
    clamp(
      AKARI_CS_SCALING_FACTOR * summary.csPerMinute,
      AKARI_CS_MIN_MULTIPLIER,
      AKARI_CS_MAX_MULTIPLIER
    )
  const goldScore = summary.goldRatioToTeamMax * AKARI_GOLD_WEIGHT
  const participationScore = summary.killParticipation * AKARI_PARTICIPATION_WEIGHT

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
    outstanding: false,
    extraordinary: false
  }
}
