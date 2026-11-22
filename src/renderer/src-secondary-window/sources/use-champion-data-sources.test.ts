import { useSecondaryWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, onTestFinished } from 'vitest'
import { effectScope } from 'vue'

import { useChampionDataSources } from './use-champion-data-sources'

function setupSources(preferences = createChampionDataSourcePreferences()) {
  setActivePinia(createPinia())

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
    windowStore: useSecondaryWindowStore()
  }
}

describe('champion data source selection', () => {
  it('uses the effective default on startup and reopen without saving manual navigation', () => {
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

    store.qq101.enabled = false
    windowStore.show = false
    windowStore.show = true

    expect(sources.activeSource.value).toBe('opgg')

    store.qq101.enabled = true

    expect(sources.activeSource.value).toBe('qq101')
  })

  it('keeps user-disabled sources visible and falls back without overwriting the preferred source', () => {
    const { sources, store } = setupSources({
      enabled: { opgg: false, qq101: true },
      defaultSource: 'opgg'
    })

    expect(sources.sources.value).toEqual([
      { id: 'qq101', enabled: true },
      { id: 'opgg', enabled: false }
    ])
    expect(store.sourceStates.opgg).toEqual({ visible: true, enabled: false, canRequest: false })
    expect(store.effectiveDefaultSource).toBe('qq101')

    sources.selectSource('opgg')

    expect(sources.activeSource.value).toBe('qq101')
    expect(store.settings.sourcePreferences.defaultSource).toBe('opgg')

    store.settings.sourcePreferences = {
      ...store.settings.sourcePreferences,
      enabled: { opgg: false, qq101: false }
    }

    expect(sources.sources.value).toHaveLength(2)
    expect(sources.activeSource.value).toBeNull()
    expect(store.effectiveDefaultSource).toBeNull()
  })

  it('hides a cloud-disabled source, preserves all preferences and restores its default when allowed', () => {
    const { sources, store } = setupSources()
    const settings = structuredClone({ ...store.settings })

    store.opgg.enabled = false

    expect(sources.sources.value).toEqual([{ id: 'qq101', enabled: true }])
    expect(store.visibleSources).toEqual(['qq101'])
    expect(store.requestableSources).toEqual(['qq101'])
    expect(store.sourceStates.opgg).toEqual({ visible: false, enabled: true, canRequest: false })
    expect(sources.activeSource.value).toBe('qq101')
    expect(store.effectiveDefaultSource).toBe('qq101')

    store.qq101.enabled = false

    expect(store.visibleSources).toEqual([])
    expect(sources.sources.value).toEqual([])
    expect(sources.activeSource.value).toBeNull()
    expect(store.effectiveDefaultSource).toBeNull()

    store.opgg.enabled = true
    store.qq101.enabled = true

    expect(sources.activeSource.value).toBe('opgg')
    expect(store.effectiveDefaultSource).toBe('opgg')
    expect(store.settings).toEqual(settings)
  })

  it('does not enable a user-disabled fallback when the preferred source is hidden', () => {
    const { sources, store } = setupSources({
      enabled: { opgg: true, qq101: false },
      defaultSource: 'opgg'
    })

    store.opgg.enabled = false

    expect(sources.sources.value).toEqual([{ id: 'qq101', enabled: false }])
    expect(sources.activeSource.value).toBeNull()
    expect(store.effectiveDefaultSource).toBeNull()
  })
})
