import type { Qq101AkariData } from '@shared/data-adapter/qq101/akari-adapter'
import { createOpggSnapshot } from '@shared/shards/champion-data'
import { createChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type {
  ChampionDataSourceId,
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

import type { RuneAutomationStatus, RuneTask } from './context'
import type { RuneWriteProgress } from './loadout-executor'
import type { Qq101ChampionDataOverview, Qq101DetailView } from './qq101/types'
import type { Qq101Page, Qq101Section } from './qq101/types'
import type { CurrentGameInput, RecommendedLoadout } from './source-contract'

export type LoadoutKind = 'runes' | 'spells' | 'items'

export const useChampionDataStore = defineStore('shard:champion-data-renderer', () => {
  const applying = shallowReactive<Record<LoadoutKind, boolean>>({
    runes: false,
    spells: false,
    items: false
  })

  const loadouts = shallowReactive<Partial<Record<ChampionDataSourceId, RecommendedLoadout>>>({})

  const currentGame = shallowReactive({
    target: null as CurrentGameInput | null,
    cycle: 0,
    applied: false,
    manual: false,
    running: false,
    failure: null as { task: RuneTask; message: string | null; progress: RuneWriteProgress } | null,

    get active(): boolean {
      return this.target !== null
    },

    get championId(): number {
      return this.target?.championId ?? 0
    },

    get position(): string {
      return this.target?.assignedPosition ?? ''
    },

    status: 'disabled' as RuneAutomationStatus,
    error: null as string | null
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

  const opgg = shallowReactive({
    enabled: false,
    snapshot: createOpggSnapshot()
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

  return {
    applying,
    loadouts,
    currentGame,
    settings,
    opgg,
    qq101
  }
})
