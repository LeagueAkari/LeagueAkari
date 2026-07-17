import type { AkariLeagueServersConfig } from '@shared/shards/akari-api'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useSgpStore = defineStore('shard:sgp-renderer', () => {
  const availability = shallowRef<{
    region: string
    rsoPlatform: string
    sgpServerId: string
    serversSupported: {
      matchHistory: boolean
      common: boolean
    }
  }>({
    region: '',
    rsoPlatform: '',
    sgpServerId: '',
    serversSupported: {
      matchHistory: false,
      common: false
    }
  })

  const leagueServers = shallowRef<AkariLeagueServersConfig>({
    updatedAt: new Date(0).toISOString(),
    servers: {},
    serverNames: {}
  })

  const isTokenReady = ref(false)

  const supportedQueues = ref<number[]>([])

  const connectionSuccessesCounted = ref(0)
  const connectionFailuresCounted = ref(0)

  return {
    availability,
    isTokenReady,
    leagueServers,
    supportedQueues,
    connectionSuccessesCounted,
    connectionFailuresCounted
  }
})
