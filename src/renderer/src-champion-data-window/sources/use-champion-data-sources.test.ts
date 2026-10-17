import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type { FeatureGateEvaluationResult } from '@shared/shards/feature-gating'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { effectScope } from 'vue'

import {
  resolveActiveChampionDataSource,
  resolveChampionDataSourceOptions,
  resolveEnabledChampionDataSources,
  resolveMinimumUpgradeVersion,
  useChampionDataSources
} from './use-champion-data-sources'

vi.mock('@renderer-shared/shards', () => ({
  useInstance: () => ({ getEvaluation: () => ({ enabled: true }) })
}))

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
  it.each([
    { opgg: true, qq101: true, order: ['opgg', 'qq101'] },
    { opgg: false, qq101: true, order: ['qq101', 'opgg'] },
    { opgg: true, qq101: false, order: ['opgg', 'qq101'] },
    { opgg: false, qq101: false, order: ['opgg', 'qq101'] }
  ])(
    'keeps disabled sources last and preserves the fixed order: $opgg / $qq101',
    ({ opgg, qq101, order }) => {
      const preferences = { enabled: { opgg, qq101 }, defaultSource: 'qq101' as const }
      const evaluations = {
        opgg: evaluation({ enabled: true }),
        qq101: evaluation({ enabled: true })
      }
      const options = resolveChampionDataSourceOptions(evaluations, preferences)

      expect(options.map((source) => source.id)).toEqual(order)
      expect(options.filter((source) => source.enabled).map((source) => source.id)).toEqual(
        resolveEnabledChampionDataSources(evaluations, preferences)
      )
    }
  )

  it('uses the saved default on startup and each reopen, without saving manual navigation', () => {
    setActivePinia(createPinia())
    const store = useChampionDataStore()
    const windowStore = useChampionDataWindowStore()
    store.settings.sourcePreferences = {
      enabled: { opgg: true, qq101: true },
      defaultSource: 'qq101'
    }
    const scope = effectScope()
    onTestFinished(() => {
      scope.stop()
      setActivePinia(undefined)
    })
    const sources = scope.run(() => useChampionDataSources())!

    expect(sources.activeSource.value).toBe('qq101')
    windowStore.show = true
    sources.selectSource('opgg')
    expect(sources.activeSource.value).toBe('opgg')
    expect(store.settings.sourcePreferences.defaultSource).toBe('qq101')
    windowStore.show = false
    windowStore.show = true
    expect(sources.activeSource.value).toBe('qq101')

    store.settings.sourcePreferences = {
      enabled: { opgg: false, qq101: false },
      defaultSource: null
    }
    expect(sources.activeSource.value).toBeNull()
    expect(sources.allSourcesDisabled.value).toBe(true)
    sources.selectSource('opgg')
    expect(sources.activeSource.value).toBeNull()
    store.settings.sourcePreferences = createChampionDataSourcePreferences()
    expect(sources.activeSource.value).toBe('opgg')
  })

  it('falls back from a remotely unavailable default without rewriting the saved preference', () => {
    const preferences = createChampionDataSourcePreferences()
    const evaluations = {
      opgg: evaluation({ enabled: false }),
      qq101: evaluation({ enabled: true })
    }
    expect(
      resolveActiveChampionDataSource(
        'opgg',
        resolveEnabledChampionDataSources(evaluations, preferences),
        preferences.defaultSource
      )
    ).toBe('qq101')
    expect(preferences.defaultSource).toBe('opgg')
  })

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
