import type { HextechAugmentSnapshot } from '@shared/types/hextech-augment'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useHextechAugmentStore = defineStore('shard:hextech-augment-renderer', () => {
  const settings = shallowReactive({ enabled: false })
  const snapshot = shallowRef<HextechAugmentSnapshot | null>(null)
  const error = shallowRef<string | null>(null)
  return { settings, snapshot, error }
})
