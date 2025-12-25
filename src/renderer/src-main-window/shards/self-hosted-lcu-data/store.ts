import { Friend } from '@shared/types/league-client/chat'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useSelfHostedLcuDataStore = defineStore('shard:self-hosted-lcu-data-renderer', () => {
  const friends = shallowRef<Friend[]>([])

  return {
    friends
  }
})
