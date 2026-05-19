import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GuideGroup } from './types'

export const useGuideStore = defineStore('shard:guide-renderer', () => {
  const pendingGuideGroups = ref<GuideGroup[]>([])
  const activeGuideId = ref<string | null>(null)
  const isEnabled = ref(false)

  return { pendingGuideGroups, activeGuideId, isEnabled }
})
