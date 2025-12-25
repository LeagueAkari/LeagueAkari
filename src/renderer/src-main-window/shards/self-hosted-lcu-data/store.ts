import { Friend } from '@shared/types/league-client/chat'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useSelfHostedLcuDataStore = defineStore('renderer:self-hosted-lcu-data', () => {
  const friends = shallowRef<Friend[]>([])

  return {
    friends
  }
})
