import type { Qq101AkariData } from '@shared/data-adapter/qq101/akari-adapter'
import { createOpggSnapshot } from '@shared/shards/champion-data'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type {
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

import type { Qq101ChampionDataOverview, Qq101DetailView } from './qq101/types'
import type { Qq101Page, Qq101Section } from './qq101/types'

export const useChampionDataStore = defineStore('shard:champion-data-renderer', () => {
  const settings = shallowReactive({
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

  const opgg = shallowReactive({
    enabled: false,
    snapshot: createOpggSnapshot(),
    isApplying: false,
    aramBalance: null as OpggChampionBalance[] | null
  })

  const qq101Pages = shallowReactive({ items: [] as Qq101Page[], activeId: 'rankings' })
  const qq101 = shallowReactive({
    enabled: false,
    isLoading: false,
    patches: [] as string[],
    requestedPreferences: null as Qq101ChampionDataPreferences | null,
    loadedPreferences: null as Qq101ChampionDataPreferences | null,
    overview: null as Qq101ChampionDataOverview | null,

    pages: qq101Pages,
    get detailView(): Qq101DetailView | null {
      const page = qq101Pages.items.find((p) => p.id === qq101Pages.activeId)
      return page?.kind === 'champion' ? page.view : null
    },

    classicLanes: { status: 'idle' } as Qq101Section<Qq101AkariData<'lanes'>>,

    error: null as string | null
  })
  const opggAramBalanceMap = computed(() => {
    const map: Record<number, OpggChampionBalance> = {}

    for (const item of opgg.aramBalance ?? []) {
      map[item.championId] = item
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
