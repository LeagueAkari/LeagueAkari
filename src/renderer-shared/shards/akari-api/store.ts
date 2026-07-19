import type { AkariContactChannels, AkariNotice } from '@shared/shards/akari-api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAkariApiStore = defineStore('shard:akari-api-renderer', () => {
  const notice = ref<AkariNotice | null>(null)
  const contactChannels = ref<AkariContactChannels | null>(null)

  return {
    notice,
    contactChannels
  }
})
