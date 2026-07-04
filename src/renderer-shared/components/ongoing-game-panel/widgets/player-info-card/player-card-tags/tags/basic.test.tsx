import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import { describe, expect, it } from 'vitest'

import { getEasyGankTag, getKillDamageEfficiencyTag } from './basic'

const createAnalysis = (overrides: Partial<AggregatedAnalysis> = {}): AggregatedAnalysis =>
  ({
    count: 20,
    detailsCount: 10,
    summary: {
      avgKillDamageEfficiency: 1
    },
    details: {
      avgEarlyDeathsWithEnemyJunglerInvolved: null
    },
    ...overrides
  }) as AggregatedAnalysis

describe('basic player card tags', () => {
  it('derives easy-gank tag thresholds from analyzed early jungle deaths', () => {
    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 2.1 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toMatchObject({
      kind: 'very-easy-gank',
      labelKey: 'ongoingGame.playerCard.veryEasyGank',
      count: 10
    })

    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 0.5 } as AggregatedAnalysis['details']
        }),
        false
      )
    ).toMatchObject({
      kind: 'hard-gank',
      labelKey: 'ongoingGame.playerCard.hardGank'
    })
  })

  it('does not create easy-gank tag for current junglers', () => {
    expect(
      getEasyGankTag(
        createAnalysis({
          details: { avgEarlyDeathsWithEnemyJunglerInvolved: 2.1 } as AggregatedAnalysis['details']
        }),
        true
      )
    ).toBeNull()
  })

  it('classifies kill damage efficiency outside the normal range', () => {
    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 1.3 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'high', value: 1.3 })

    expect(
      getKillDamageEfficiencyTag(
        createAnalysis({
          summary: { avgKillDamageEfficiency: 0.7 } as AggregatedAnalysis['summary']
        })
      )
    ).toEqual({ kind: 'low', value: 0.7 })
  })
})
