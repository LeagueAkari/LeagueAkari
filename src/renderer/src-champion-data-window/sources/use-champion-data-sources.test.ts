import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type { FeatureGateEvaluationResult } from '@shared/shards/feature-gating'
import { CHAMPION_DATA_OPGG_FEATURE_GATE } from '@shared/types/champion-data'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { effectScope } from 'vue'

import { resolveMinimumUpgradeVersion, useChampionDataSources } from './use-champion-data-sources'

const { getEvaluation } = vi.hoisted(() => ({ getEvaluation: vi.fn() }))
vi.mock('@renderer-shared/shards', () => ({
  useInstance: () => ({ getEvaluation })
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

function setupSources(
  preferences = createChampionDataSourcePreferences(),
  unavailableGate?: string
) {
  setActivePinia(createPinia())
  getEvaluation.mockImplementation((key: string) =>
    evaluation({ enabled: key !== unavailableGate })
  )
  const store = useChampionDataStore()
  store.settings.sourcePreferences = preferences

  const scope = effectScope()
  onTestFinished(() => {
    scope.stop()
    setActivePinia(undefined)
  })

  return {
    sources: scope.run(useChampionDataSources)!,
    store,
    windowStore: useChampionDataWindowStore()
  }
}

describe('champion data source selection', () => {
  it('uses the saved default on startup and each reopen, without saving manual navigation', () => {
    const { sources, store, windowStore } = setupSources({
      enabled: { opgg: true, qq101: true },
      defaultSource: 'qq101'
    })

    expect(sources.sources.value.map((source) => source.id)).toEqual(['opgg', 'qq101'])
    expect(sources.activeSource.value).toBe('qq101')
    windowStore.show = true
    sources.selectSource('opgg')
    expect(sources.activeSource.value).toBe('opgg')
    expect(store.settings.sourcePreferences.defaultSource).toBe('qq101')
    windowStore.show = false
    windowStore.show = true
    expect(sources.activeSource.value).toBe('qq101')

    store.settings.sourcePreferences = {
      enabled: { opgg: false, qq101: true },
      defaultSource: 'qq101'
    }
    expect(sources.sources.value).toEqual([
      { id: 'qq101', enabled: true, available: true },
      { id: 'opgg', enabled: false, available: true }
    ])
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
    const { sources, store } = setupSources(
      createChampionDataSourcePreferences(),
      CHAMPION_DATA_OPGG_FEATURE_GATE
    )
    expect(sources.sources.value).toEqual([
      { id: 'qq101', enabled: true, available: true },
      { id: 'opgg', enabled: false, available: false }
    ])
    expect(sources.activeSource.value).toBe('qq101')
    expect(sources.allSourcesDisabled.value).toBe(false)
    expect(store.settings.sourcePreferences.defaultSource).toBe('opgg')
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
