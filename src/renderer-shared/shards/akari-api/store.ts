import {
  type AkariServiceBaseUrls,
  DEFAULT_AKARI_SERVICE_BASE_URLS
} from '@shared/shards/akari-api'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useAkariApiStore = defineStore('shard:akari-api-renderer', () => {
  const baseUrls = shallowRef<AkariServiceBaseUrls>({ ...DEFAULT_AKARI_SERVICE_BASE_URLS })

  return {
    baseUrls
  }
})
