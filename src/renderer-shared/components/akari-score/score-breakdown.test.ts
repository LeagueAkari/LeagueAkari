import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { describe, expect, it } from 'vitest'

import { getAkariScoreBreakdownItems } from './score-breakdown'

describe('getAkariScoreBreakdownItems', () => {
  it('returns every Akari Score part with its value and maximum score', () => {
    const score: AkariScore = {
      kdaScore: 0.1875,
      winRateScore: 0.25,
      dmgScore: 0.5,
      dmgTakenScore: 0.375,
      csScore: 0.375,
      goldScore: 0.375,
      participationScore: 0.375,
      visionScore: 0.375,
      total: 2.8125,
      outstanding: true,
      extraordinary: true
    }

    expect(getAkariScoreBreakdownItems(score)).toEqual([
      {
        key: 'kdaScore',
        labelKey: 'akariScore.parts.kda',
        value: 0.1875,
        max: 0.35,
        progressPercentage: 53.57142857142857,
        progressStatus: 'default'
      },
      {
        key: 'winRateScore',
        labelKey: 'akariScore.parts.winRate',
        value: 0.25,
        max: 0.25,
        progressPercentage: 100,
        progressStatus: 'default'
      },
      {
        key: 'dmgScore',
        labelKey: 'akariScore.parts.damage',
        value: 0.5,
        max: 1,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'dmgTakenScore',
        labelKey: 'akariScore.parts.damageTaken',
        value: 0.375,
        max: 0.75,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'csScore',
        labelKey: 'akariScore.parts.cs',
        value: 0.375,
        max: 0.75,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'goldScore',
        labelKey: 'akariScore.parts.gold',
        value: 0.375,
        max: 0.75,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'participationScore',
        labelKey: 'akariScore.parts.participation',
        value: 0.375,
        max: 0.75,
        progressPercentage: 50,
        progressStatus: 'default'
      },
      {
        key: 'visionScore',
        labelKey: 'akariScore.parts.vision',
        value: 0.375,
        max: 0.75,
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
      csScore: 1,
      goldScore: 4,
      participationScore: 4,
      visionScore: 4,
      total: 28,
      outstanding: false,
      extraordinary: false
    }

    const items = getAkariScoreBreakdownItems(score)

    expect(items.find((item) => item.key === 'winRateScore')?.progressPercentage).toBe(0)
    expect(items.find((item) => item.key === 'dmgScore')?.progressPercentage).toBe(100)
  })
})
