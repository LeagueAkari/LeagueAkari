import { LeagueServersConfig } from '@shared/validators/remote-config'
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

  const leagueServers = shallowRef<LeagueServersConfig>({
    version: 0,
    lastUpdate: 0,
    servers: {},
    serverNames: {},
    tencentServerMatchHistoryInteroperability: [],
    tencentServerSpectatorInteroperability: [],
    tencentServerSummonerInteroperability: []
  })

  const isTokenReady = ref(false)

  const supportedQueues = ref<number[]>([])

  return {
    availability,
    isTokenReady,
    leagueServers,
    supportedQueues
  }
})
