import { Friend } from '@shared/types/league-client/chat'
import { GameQueue } from '@shared/types/league-client/game-queues'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useSelfHostedLcuDataStore = defineStore('shard:self-hosted-lcu-data-renderer', () => {
  const friends = shallowRef<Friend[]>([])
  const gameQueues = shallowRef<Record<number, GameQueue>>({})

  return {
    friends,
    gameQueues
  }
})
