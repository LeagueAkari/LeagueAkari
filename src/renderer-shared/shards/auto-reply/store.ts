import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useAutoReplyStore = defineStore('shard:auto-reply-renderer', () => {
  const settings = shallowReactive({
    enabled: false,
    text: '',
    enableOnAway: false,
    lockOfflineStatus: false
  })

  return {
    settings
  }
})
