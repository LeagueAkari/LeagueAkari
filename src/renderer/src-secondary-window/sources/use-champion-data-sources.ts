import { useSecondaryWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { computed, ref, watch } from 'vue'

export interface ChampionDataSourceOption {
  id: ChampionDataSourceId
  enabled: boolean
}

export function useChampionDataSources() {
  const store = useChampionDataStore()
  const windowStore = useSecondaryWindowStore()

  const sourceTab = ref<ChampionDataSourceId | null>(null)

  const sources = computed<ChampionDataSourceOption[]>(() => {
    const options = store.visibleSources.map((id) => ({
      id,
      enabled: store.sourceStates[id].enabled
    }))

    return [
      ...options.filter((source) => source.enabled),
      ...options.filter((source) => !source.enabled)
    ]
  })

  const activeSource = computed(() => {
    if (sourceTab.value && store.sourceStates[sourceTab.value].canRequest) {
      return sourceTab.value
    }

    return store.effectiveDefaultSource
  })

  const selectSource = (source: ChampionDataSourceId) => {
    if (store.sourceStates[source].canRequest) {
      sourceTab.value = source
    }
  }

  watch(
    () => windowStore.show,
    (shown) => {
      if (shown) {
        sourceTab.value = null
      }
    },
    { flush: 'sync' }
  )

  return { sources, activeSource, selectSource }
}
