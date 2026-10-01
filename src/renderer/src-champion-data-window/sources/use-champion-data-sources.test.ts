import type { FeatureGateEvaluationResult } from '@shared/shards/feature-gating'
import { describe, expect, it } from 'vitest'

import {
  resolveActiveChampionDataSource,
  resolveEnabledChampionDataSources,
  resolveMinimumUpgradeVersion
} from './use-champion-data-sources'

function evaluation(overrides: Partial<FeatureGateEvaluationResult>): FeatureGateEvaluationResult {
  return {
    key: 'test',
    enabled: false,
    configured: true,
    snapshotStatus: 'available',
    origin: 'server',
    decision: 'rule-not-matched',
    effectiveRule: null,
    mismatches: [],
    ...overrides
  }
}

describe('champion data source selection', () => {
  it('shows only sources whose structured evaluation is enabled', () => {
    expect(
      resolveEnabledChampionDataSources({
        opgg: evaluation({ key: 'champion-data.opgg', enabled: true, mismatches: [] }),
        qq101: evaluation({
          key: 'champion-data.qq101',
          enabled: false,
          origin: 'dev-override',
          decision: 'force-off',
          mismatches: []
        })
      })
    ).toEqual(['opgg'])
  })

  it('keeps a visible selection and otherwise falls back in OP.GG then 101 order', () => {
    expect(resolveActiveChampionDataSource('qq101', ['opgg', 'qq101'])).toBe('qq101')
    expect(resolveActiveChampionDataSource('qq101', ['opgg'])).toBe('opgg')
    expect(resolveActiveChampionDataSource('opgg', ['qq101'])).toBe('qq101')
    expect(resolveActiveChampionDataSource('opgg', [])).toBeNull()
  })

  it('shows the lowest update target only when every source has one pure minimum mismatch', () => {
    expect(
      resolveMinimumUpgradeVersion({
        opgg: evaluation({
          mismatches: [{ kind: 'min-version', actual: '1.5.2', minVersionInclusive: '1.6.0' }]
        }),
        qq101: evaluation({
          mismatches: [{ kind: 'min-version', actual: '1.5.2', minVersionInclusive: '1.5.5' }]
        })
      })
    ).toBe('1.5.5')

    expect(
      resolveMinimumUpgradeVersion({
        opgg: evaluation({
          mismatches: [{ kind: 'min-version', actual: '1.5.2', minVersionInclusive: '1.6.0' }]
        }),
        qq101: evaluation({
          origin: 'dev-override',
          decision: 'force-off',
          mismatches: []
        })
      })
    ).toBeNull()

    expect(
      resolveMinimumUpgradeVersion({
        opgg: evaluation({
          snapshotStatus: 'unavailable',
          origin: 'dev-override',
          mismatches: [{ kind: 'min-version', actual: '1.5.2', minVersionInclusive: '1.6.0' }]
        }),
        qq101: evaluation({
          snapshotStatus: 'unavailable',
          origin: 'dev-override',
          mismatches: [{ kind: 'min-version', actual: '1.5.2', minVersionInclusive: '1.6.0' }]
        })
      })
    ).toBeNull()
  })
})
