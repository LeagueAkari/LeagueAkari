import type { AkariNotice } from '@shared/shards/akari-api'
import type { LatestReleaseInfo } from '@shared/types/akari'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export const useAkariApiStore = defineStore('shard:akari-api-renderer', () => {
  const notice = ref<AkariNotice | null>(null)
  const latestRelease = shallowRef<LatestReleaseInfo | null>(null)

  const isUpdatingNotice = ref(false)
  const isUpdatingLatestRelease = ref(false)

  const settings = shallowReactive({
    updateLatestRelease: true
  })

  return {
    notice,
    latestRelease,
    isUpdatingNotice,
    isUpdatingLatestRelease,
    settings
  }
})
