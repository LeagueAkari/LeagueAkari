import type { AutoMiscRankedStatus } from '@shared/shards/auto-misc'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useAutoMiscStore = defineStore('shard:auto-misc-renderer', () => {
  const settings = shallowReactive({
    autoReplyEnabled: false,
    autoReplyEnableOnAway: false,
    autoReplyText: '',
    lockOfflineStatus: false,
    autoSetStatusMessageEnabled: false,
    statusMessage: '',
    autoSetRankedStatusEnabled: false,
    rankedStatus: {
      queue: 'RANKED_SOLO_5x5',
      tier: 'CHALLENGER',
      division: 'I'
    } as AutoMiscRankedStatus
  })

  return {
    settings
  }
})
