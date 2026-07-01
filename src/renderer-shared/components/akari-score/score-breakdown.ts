import type { AkariScore } from '@shared/data-adapter/analysis/player'
import {
  AKARI_CS_MAX_SCORE,
  AKARI_DAMAGE_TAKEN_WEIGHT,
  AKARI_DAMAGE_WEIGHT,
  AKARI_GOLD_WEIGHT,
  AKARI_KDA_MAX_SCORE,
  AKARI_PARTICIPATION_WEIGHT,
  AKARI_VISION_MAX_SCORE,
  AKARI_WIN_RATE_WEIGHT
} from '@shared/data-adapter/analysis/player/constants'

export type AkariScorePartKey =
  | 'kdaScore'
  | 'winRateScore'
  | 'dmgScore'
  | 'dmgTakenScore'
  | 'csScore'
  | 'goldScore'
  | 'participationScore'
  | 'visionScore'

export type AkariScoreProgressStatus = 'default' | 'info'

export type AkariScoreBreakdownItem = {
  key: AkariScorePartKey
  labelKey: string
  value: number
  max: number | null
  progressPercentage: number
  progressStatus: AkariScoreProgressStatus
}

const AKARI_SCORE_PARTS: Array<{
  key: AkariScorePartKey
  labelKey: string
  max: number | null
}> = [
  {
    key: 'kdaScore',
    labelKey: 'akariScore.parts.kda',
    max: AKARI_KDA_MAX_SCORE
  },
  {
    key: 'winRateScore',
    labelKey: 'akariScore.parts.winRate',
    max: AKARI_WIN_RATE_WEIGHT
  },
  {
    key: 'dmgScore',
    labelKey: 'akariScore.parts.damage',
    max: AKARI_DAMAGE_WEIGHT
  },
  {
    key: 'dmgTakenScore',
    labelKey: 'akariScore.parts.damageTaken',
    max: AKARI_DAMAGE_TAKEN_WEIGHT
  },
  {
    key: 'csScore',
    labelKey: 'akariScore.parts.cs',
    max: AKARI_CS_MAX_SCORE
  },
  {
    key: 'goldScore',
    labelKey: 'akariScore.parts.gold',
    max: AKARI_GOLD_WEIGHT
  },
  {
    key: 'participationScore',
    labelKey: 'akariScore.parts.participation',
    max: AKARI_PARTICIPATION_WEIGHT
  },
  {
    key: 'visionScore',
    labelKey: 'akariScore.parts.vision',
    max: AKARI_VISION_MAX_SCORE
  }
]

function clampProgressPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(value, 0), 100)
}

export function getAkariScoreBreakdownItems(score: AkariScore): AkariScoreBreakdownItem[] {
  return AKARI_SCORE_PARTS.map((part) => {
    const value = score[part.key]
    const max = part.max
    const hasFixedMax = max !== null

    return {
      ...part,
      value,
      progressPercentage: hasFixedMax ? clampProgressPercentage((value / max) * 100) : 100,
      progressStatus: hasFixedMax ? 'default' : 'info'
    }
  })
}
