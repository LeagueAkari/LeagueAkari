import { SgpGsmLedgeRegion } from '@shared/types/sgp/gsm'
import { SgpServersConfig } from '@shared/types/shards/sgp'
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

  const sgpServerConfig = shallowRef<SgpServersConfig>({
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

  const data = shallowRef({
    gsmGame: null as SgpGsmLedgeRegion | null
  })

  return {
    availability,
    isTokenReady,
    sgpServerConfig,
    supportedQueues,
    data
  }
})
