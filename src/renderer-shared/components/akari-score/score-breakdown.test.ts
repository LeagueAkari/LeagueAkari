import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { describe, expect, it } from 'vitest'

import { getAkariScoreBreakdownItems } from './score-breakdown'

describe('getAkariScoreBreakdownItems', () => {
  it('returns every Akari Score part with its value and maximum score', () => {
    const score: AkariScore = {
      kdaScore: 0.5,
      winRateScore: 0.5,
      dmgScore: 1.5,
      dmgTakenScore: 1,
      healingScore: 1,
      csScore: 1,
      goldScore: 1,
      participationScore: 1,
      visionScore: 1,
      total: 8.5,
      maxScore: 17,
      outstanding: true,
      extraordinary: true
    }

    expect(getAkariScoreBreakdownItems(score)).toEqual([
      {
        key: 'kdaScore',
        labelKey: 'akariScore.parts.kda',
        value: 0.5,
        max: 1,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'winRateScore',
        labelKey: 'akariScore.parts.winRate',
        value: 0.5,
        max: 1,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'dmgScore',
        labelKey: 'akariScore.parts.damage',
        value: 1.5,
        max: 3,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'dmgTakenScore',
        labelKey: 'akariScore.parts.damageTaken',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'healingScore',
        labelKey: 'akariScore.parts.healing',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'csScore',
        labelKey: 'akariScore.parts.cs',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'goldScore',
        labelKey: 'akariScore.parts.gold',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'participationScore',
        labelKey: 'akariScore.parts.participation',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'visionScore',
        labelKey: 'akariScore.parts.vision',
        value: 1,
        max: 2,
        progressPercentage: 50,
        progressStatus: 'default'
      }
    ])
  })

  it('clamps capped progress to the progress bar range', () => {
    const score: AkariScore = {
      kdaScore: 1,
      winRateScore: -2,
      dmgScore: 12,
      dmgTakenScore: 8,
      healingScore: 4,
      csScore: 1,
      goldScore: 4,
      participationScore: 4,
      visionScore: 4,
      total: 32,
      maxScore: 17,
      outstanding: false,
      extraordinary: false
    }

    const items = getAkariScoreBreakdownItems(score)

    expect(items.find((item) => item.key === 'winRateScore')?.progressPercentage).toBe(0)
    expect(items.find((item) => item.key === 'dmgScore')?.progressPercentage).toBe(100)
  })
})
