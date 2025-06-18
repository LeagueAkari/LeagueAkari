import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
interface UpdateProgressInfo {
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

  downloadingProgress: number

  averageDownloadSpeed: number

  downloadTimeLeft: number

  fileSize: number

  unpackingProgress: number
}

// copied from main shard
interface LastUpdateResult {
  success: boolean
  reason: string
}

export const useSelfUpdateStore = defineStore('shard:self-update-renderer', () => {
  const settings = shallowReactive({
    autoCheckUpdates: true,
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
