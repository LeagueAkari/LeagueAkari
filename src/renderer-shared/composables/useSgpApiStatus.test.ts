import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useSgpApiStatus } from './useSgpApiStatus'

const createLeagueServers = () => ({
  version: 2,
  lastUpdate: 0,
  servers: {
    NA1: {
      matchHistory: 'https://na1.example.test',
      common: 'https://na1-common.example.test'
    },
    TENCENT_HN10: {
      matchHistory: 'https://hn10.example.test',
      common: 'https://hn10-common.example.test'
    }
  },
  serverNames: {},
  tencentServerMatchHistoryInteroperability: [],
  tencentServerSummonerInteroperability: []
})

describe('useSgpApiStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns unavailable and not ready when no current SGP server is known', () => {
    const sgps = useSgpStore()
    sgps.leagueServers = createLeagueServers()
    sgps.isTokenReady = true

    expect(useSgpApiStatus().value).toEqual({
      canUse: false,
      isReady: false
    })
  })

  it('uses the current logged-in SGP server when no target server is provided', () => {
    const sgps = useSgpStore()
    sgps.leagueServers = createLeagueServers()
    sgps.availability = {
      region: 'NA',
      rsoPlatform: 'NA1',
      sgpServerId: 'NA1',
      serversSupported: {
        matchHistory: true,
        common: true
      }
    }
    sgps.isTokenReady = true

    expect(useSgpApiStatus().value).toEqual({
      canUse: true,
      isReady: true
    })
  })

  it('uses the provided target SGP server when one is given', () => {
    const sgps = useSgpStore()
    sgps.leagueServers = createLeagueServers()
    sgps.availability = {
      region: 'NA',
      rsoPlatform: 'NA1',
      sgpServerId: 'NA1',
      serversSupported: {
        matchHistory: true,
        common: true
      }
    }
    sgps.isTokenReady = true

    expect(useSgpApiStatus('TENCENT_HN10').value).toEqual({
      canUse: true,
      isReady: true
    })
  })

  it('updates when a reactive target SGP server changes', () => {
    const sgps = useSgpStore()
    const target = ref('NA1')
    sgps.leagueServers = createLeagueServers()
    sgps.isTokenReady = true

    const status = useSgpApiStatus(target)

    expect(status.value).toEqual({
      canUse: true,
      isReady: true
    })

    target.value = 'UNKNOWN'

    expect(status.value).toEqual({
      canUse: false,
      isReady: false
    })
  })
})
