import { SendableItem } from '@shared/types/shards/in-game-send'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export interface TemplateDef {
  id: string
  name: string
  code: string
  isValid: boolean
  type: string
  error: string | null
}

export const useInGameSendStore = defineStore('shard:in-game-send-renderer', () => {
  const settings = shallowReactive({
    sendableItems: [] as SendableItem[],
    templates: [] as TemplateDef[],
    cancelShortcut: null as string | null,
    sendInterval: 65
  })

  return {
    settings
  }
})
