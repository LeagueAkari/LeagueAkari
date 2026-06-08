import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useInGameSendStore = defineStore('shard:in-game-send-renderer', () => {
  const settings = shallowReactive({
    cancelShortcut: null as string | null,
    sendInterval: 65
  })

  return {
    settings
  }
})
