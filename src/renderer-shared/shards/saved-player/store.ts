import { createDefaultSavedPlayerTagPhrases } from '@shared/shards/saved-player'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useSavedPlayerStore = defineStore('shard:saved-player-renderer', () => {
  const settings = shallowReactive({
    playerTagPhrases: createDefaultSavedPlayerTagPhrases(),
    playerTagPhrasePanelExpanded: true
  })

  return {
    settings
  }
})
