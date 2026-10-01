import { createOpggSnapshot } from '@shared/shards/champion-data'
import type {
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import type { OpggAramBalanceItem } from '@shared/types/opgg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

import type { Qq101ChampionDataDetails, Qq101ChampionDataOverview } from './qq101/types'

export const useChampionDataStore = defineStore('shard:champion-data-renderer', () => {
  const settings = shallowReactive({
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

  const opgg = shallowReactive({
    enabled: false,
    snapshot: createOpggSnapshot(),
    isApplying: false,
    aramBalance: null as OpggAramBalanceItem[] | null
  })

  const qq101 = shallowReactive({
    enabled: false,
    isLoading: false,
    patches: [] as string[],
    requestedPreferences: null as Qq101ChampionDataPreferences | null,
    loadedPreferences: null as Qq101ChampionDataPreferences | null,
    overview: null as Qq101ChampionDataOverview | null,
    details: null as Qq101ChampionDataDetails | null,
    selectedChampionId: null as number | null,
    error: null as string | null
  })
  const opggAramBalanceMap = computed(() => {
    const map: Record<number, OpggAramBalanceItem> = {}

    for (const item of opgg.aramBalance ?? []) {
      map[item.champion_id] = item
    }

    return map
  })

  return {
    settings,
    opgg,
    qq101,
    opggAramBalanceMap
  }
})
