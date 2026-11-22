import { createChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import {
  CHAMPION_DATA_SOURCE_ORDER,
  type OpggChampionDataPreferences,
  type Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export type LoadoutKind = 'runes' | 'spells' | 'items'

export const useChampionDataStore = defineStore('shard:champion-data-renderer', () => {
  const applying = shallowReactive<Record<LoadoutKind, boolean>>({
    runes: false,
    spells: false,
    items: false
  })

  const settings = shallowReactive({
    automation: createChampionDataAutomationSettings(),
    sourcePreferences: createChampionDataSourcePreferences(),
    opggFlashPosition: 'auto' as OpggFlashPosition,
    opggPreferences: {
      mode: 'ranked',
      position: 'top',
      region: 'global',
      tier: 'all'
    } as OpggChampionDataPreferences,
    qq101Preferences: {
      mode: 'ranked',
      position: 'all',
      patch: null,
      tier: 255
    } as Qq101ChampionDataPreferences
  })

  // Only cloud availability is synced from the main process.
  const opgg = shallowReactive({ enabled: true })
  const qq101 = shallowReactive({ enabled: true })

  const sourceStates = computed(() => ({
    opgg: {
      visible: opgg.enabled,
      enabled: settings.sourcePreferences.enabled.opgg,
      canRequest: opgg.enabled && settings.sourcePreferences.enabled.opgg
    },
    qq101: {
      visible: qq101.enabled,
      enabled: settings.sourcePreferences.enabled.qq101,
      canRequest: qq101.enabled && settings.sourcePreferences.enabled.qq101
    }
  }))

  const visibleSources = computed(() =>
    CHAMPION_DATA_SOURCE_ORDER.filter((source) => sourceStates.value[source].visible)
  )

  const requestableSources = computed(() =>
    visibleSources.value.filter((source) => sourceStates.value[source].canRequest)
  )

  const effectiveDefaultSource = computed(() => {
    const preferred = settings.sourcePreferences.defaultSource

    if (preferred && requestableSources.value.includes(preferred)) {
      return preferred
    }

    return requestableSources.value[0] ?? null
  })

  return {
    applying,
    settings,
    sourceStates,
    visibleSources,
    requestableSources,
    effectiveDefaultSource,
    opgg,
    qq101
  }
})
