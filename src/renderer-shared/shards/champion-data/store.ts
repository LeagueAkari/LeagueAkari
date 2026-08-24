import type {
  ChampionDataFallbackReason,
  ChampionDataPreferences,
  ChampionDataSourceAvailability,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useChampionDataStore = defineStore('shard:champion-data-renderer', () => {
  const settings = shallowReactive({
    preferredSource: 'opgg' as ChampionDataSourceId,
    preferences: {
      mode: 'ranked',
      position: 'top',
      region: 'global',
      tier: 'all'
    } as ChampionDataPreferences
  })
  const availability = shallowRef<ChampionDataSourceAvailability>({
    preferredSource: 'opgg',
    sources: {
      opgg: { enabled: true },
      qq101: { enabled: false }
    }
  })
  const lastEffectiveSource = shallowRef<ChampionDataSourceId | null>(null)
  const lastFallbackReason = shallowRef<ChampionDataFallbackReason | null>(null)

  return {
    settings,
    availability,
    lastEffectiveSource,
    lastFallbackReason
  }
})
