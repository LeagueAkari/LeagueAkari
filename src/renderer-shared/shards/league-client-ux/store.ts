import { UxCommandLine } from '@shared/shards/league-client-ux'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useLeagueClientUxStore = defineStore('shard:league-client-ux-renderer', () => {
  const settings = shallowReactive({
    useWmi: false
  })

  const launchedClients = shallowRef<UxCommandLine[]>([])
  const hasClientButNoCommandLine = shallowRef(false)

  return {
    settings,
    launchedClients,
    hasClientButNoCommandLine
  }
})
