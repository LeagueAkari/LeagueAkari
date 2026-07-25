import type {
  AkariContactChannels,
  AkariFeatureGateSnapshot,
  AkariNotice
} from '@shared/shards/akari-api'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useAkariApiStore = defineStore('shard:akari-api-renderer', () => {
  const featureGates = shallowRef<AkariFeatureGateSnapshot | null>(null)
  const notice = ref<AkariNotice | null>(null)
  const contactChannels = ref<AkariContactChannels | null>(null)

  return {
    featureGates,
    notice,
    contactChannels
  }
})
