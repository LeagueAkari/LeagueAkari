import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export const useSelfUpdateStore = defineStore('shard:self-update-renderer', () => {
  const settings = shallowReactive({
    autoCheckUpdates: true,
    autoDownloadUpdates: true,
    ignoreVersion: null as string | null
  })

  const isUpdateSupportedOnCurrentPlatform = ref(false)
  const isCheckingUpdates = ref(false)
  const releaseInfo = shallowRef<SelfUpdateReleaseInfo | null>(null)
  const updateProgressInfo = shallowRef<UpdateProgressInfo | null>(null)
  const lastUpdateSucceeded = ref<boolean | null>(null)

  return {
    settings,

    isUpdateSupportedOnCurrentPlatform,
    isCheckingUpdates,
    releaseInfo,
    updateProgressInfo,
    lastUpdateSucceeded
  }
})
