import { LastUpdateResult, UpdateProgressInfo } from '@shared/types/shards/self-update'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export const useSelfUpdateStore = defineStore('shard:self-update-renderer', () => {
  const settings = shallowReactive({
    autoDownloadUpdates: true,
    ignoreVersion: null as string | null
  })

  const lastCheckAt = ref<Date | null>(null)
  const updateProgressInfo = shallowRef<UpdateProgressInfo | null>(null)
  const lastUpdateResult = shallowRef<LastUpdateResult | null>(null)

  return {
    settings,

    lastCheckAt,
    updateProgressInfo,
    lastUpdateResult
  }
})
