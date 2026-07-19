import {
  AKARI_CS_FULL_SCORE_PER_MINUTE,
  AKARI_CS_MAX_SCORE,
  AKARI_CS_MIN_SCORE_PER_MINUTE,
  AKARI_EXPECTED_CONTRIBUTION_BASELINE_RATIO,
  AKARI_HEALING_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO,
  AKARI_HEALING_MAX_SCORE,
  AKARI_HEALING_MIN_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO,
  AKARI_HEALING_SOLO_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO,
  AKARI_KDA_BASELINE,
  AKARI_KDA_MAX_SCORE,
  AKARI_KDA_WEIGHT,
  AKARI_PARTICIPATION_MIN_SHARE,
  AKARI_PARTICIPATION_WEIGHT,
  AKARI_WIN_RATE_BASELINE,
  AKARI_WIN_RATE_WEIGHT
} from './constants'

function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

function scoreLinearRange(value: number, min: number, max: number, maxScore: number) {
  return ((clamp(value, min, max) - min) / (max - min)) * maxScore
}

export function scoreExpectedContribution(ratio: number, fullScoreRatio: number, maxScore: number) {
  return scoreLinearRange(
    ratio,
    AKARI_EXPECTED_CONTRIBUTION_BASELINE_RATIO,
    fullScoreRatio,
    maxScore
  )
}

export function scoreKda(kda: number) {
  const effectiveKda = Math.max(kda - AKARI_KDA_BASELINE, 0)
  return clamp(Math.sqrt(effectiveKda) * AKARI_KDA_WEIGHT, 0, AKARI_KDA_MAX_SCORE)
}

export function scoreHealing(
  healingRatioToTeamAverageDamageTaken: number,
  teamParticipantCount: number
) {
  const fullScoreRatio =
    teamParticipantCount === 1
      ? AKARI_HEALING_SOLO_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO
      : AKARI_HEALING_FULL_SCORE_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO

  return scoreLinearRange(
    healingRatioToTeamAverageDamageTaken,
    AKARI_HEALING_MIN_TEAM_AVERAGE_DAMAGE_TAKEN_RATIO,
    fullScoreRatio,
    AKARI_HEALING_MAX_SCORE
  )
}

export function scoreWinRate(winRate: number) {
  return scoreLinearRange(winRate, AKARI_WIN_RATE_BASELINE, 1, AKARI_WIN_RATE_WEIGHT)
}

export function scoreCsPerMinute(csPerMinute: number) {
  return scoreLinearRange(
    csPerMinute,
    AKARI_CS_MIN_SCORE_PER_MINUTE,
    AKARI_CS_FULL_SCORE_PER_MINUTE,
    AKARI_CS_MAX_SCORE
  )
}

export function scoreParticipation(killParticipation: number) {
  return scoreLinearRange(
    killParticipation,
    AKARI_PARTICIPATION_MIN_SHARE,
    1,
    AKARI_PARTICIPATION_WEIGHT
  )
}
