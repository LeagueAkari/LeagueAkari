import type { AkariNotice } from '@shared/shards/akari-api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAkariApiStore = defineStore('shard:akari-api-renderer', () => {
  const notice = ref<AkariNotice | null>(null)

  const isUpdatingNotice = ref(false)

  return {
    notice,
    isUpdatingNotice
  }
})
