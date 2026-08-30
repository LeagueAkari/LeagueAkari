import type { FeatureGateDevOverrides } from '@shared/shards/feature-gating'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useFeatureGatingStore = defineStore('shard:feature-gating-renderer', () => {
  const devOverrides = shallowRef<FeatureGateDevOverrides>({})

  return { devOverrides }
})
