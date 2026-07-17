import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import type { AkariLeagueServersConfig } from '@shared/shards/akari-api'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSgpServerQuery } from './useSgpServerQuery'

const leagueServers = {
  updatedAt: new Date(0).toISOString(),
  servers: {
    TENCENT_HN1: {
      common: 'https://hn1.example.test',
      matchHistory: 'https://hn1-history.example.test',
      isTencent: true
    },
    TENCENT_HN10: {
      common: 'https://hn10.example.test',
      matchHistory: 'https://hn10-history.example.test',
      isTencent: true
    },
    NA1: {
      common: 'https://na1.example.test',
      matchHistory: 'https://na1-history.example.test',
      isTencent: false
    },
    EUW: {
      common: 'https://euw.example.test',
      matchHistory: 'https://euw-history.example.test',
      isTencent: false
    }
  },
  serverNames: {}
} satisfies AkariLeagueServersConfig

describe('useSgpServerQuery', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows every Tencent server to query every other Tencent server', () => {
    const sgps = useSgpStore()
    sgps.leagueServers = leagueServers
    sgps.availability = {
      region: 'TENCENT',
      rsoPlatform: 'HN1',
      sgpServerId: 'TENCENT_HN1',
      serversSupported: { common: true, matchHistory: true }
    }

    const { canQueryServer } = useSgpServerQuery()

    expect(canQueryServer('TENCENT_HN10')).toBe(true)
    expect(canQueryServer('NA1')).toBe(false)
  })

  it('keeps non-Tencent servers isolated to their own server', () => {
    const sgps = useSgpStore()
    sgps.leagueServers = leagueServers
    sgps.availability = {
      region: 'NA',
      rsoPlatform: 'NA1',
      sgpServerId: 'NA1',
      serversSupported: { common: true, matchHistory: true }
    }

    const { canQueryServer } = useSgpServerQuery()

    expect(canQueryServer('NA1')).toBe(true)
    expect(canQueryServer('EUW')).toBe(false)
  })
})
