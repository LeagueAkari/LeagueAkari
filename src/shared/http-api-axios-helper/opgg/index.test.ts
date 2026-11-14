import axios, { type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { OpggHttpApiAxiosHelper } from '.'
import { OpggDesktopHttpApiAxiosHelper } from './desktop'

// Request contracts captured in opgg2.chls / desktop 3.3.0, verified live on 2026-11-15.
const capturedRequests: {
  name: string
  request: (api: OpggHttpApiAxiosHelper, signal: AbortSignal) => Promise<AxiosResponse<unknown>>
  path: string
  query: Record<string, string>
}[] = [
  {
    name: 'matchup and role filtered build',
    request: (api, signal) =>
      api.getRankedChampion('global', 64, 'jungle', {
        targetChampionId: 104,
        role: 'FIGHTER',
        isMore: true,
        signal
      }),
    path: '/api/global/champions/ranked/64/jungle',
    query: { target_champion: '104', role: 'FIGHTER', is_more: 'true' }
  },
  {
    name: 'champion summary',
    request: (api, signal) => api.getRankedChampionSummary('global', 64, { signal }),
    path: '/api/global/champions/ranked/64/summaries',
    query: {}
  },
  {
    name: 'matchup comparison',
    request: (api, signal) =>
      api.getRankedChampionMatchup('global', 64, 'jungle', 104, {
        tier: 'emerald_plus',
        signal
      }),
    path: '/api/global/champions/ranked/64/jungle/counters/104',
    query: { tier: 'emerald_plus' }
  },
  {
    name: 'flex lane synergies',
    request: (api, signal) =>
      api.getRankedChampionSynergies('global', 222, 'adc', 'support', {
        queue: 'flex',
        tier: 'all',
        signal
      }),
    path: '/api/global/champions/flex/222/adc/synergies/support',
    query: { tier: 'all' }
  },
  {
    name: 'monthly tier statistics',
    request: (api, signal) => api.getRankedTierStatistics('global', { signal }),
    path: '/api/global/champions/ranked/tier-statistics',
    query: { period: 'month' }
  },
  {
    name: 'Brawl tier list',
    request: (api, signal) => api.getBrawlTiers({ signal }),
    path: '/api/contents/tiers',
    query: {}
  },
  {
    name: 'champion names',
    request: (api, signal) => api.getMetaChampionNames({ locale: 'zh_CN', signal }),
    path: '/api/meta/champion-names',
    query: { hl: 'zh_CN' }
  },
  {
    name: 'rune styles',
    request: (api, signal) => api.getMetaRunePages({ locale: 'zh_CN', signal }),
    path: '/api/meta/rune-pages',
    query: { hl: 'zh_CN' }
  },
  {
    name: 'Mayhem augment metadata',
    request: (api, signal) => api.getMetaAramAugments({ locale: 'zh_CN', signal }),
    path: '/api/meta/aram-augments',
    query: { hl: 'zh_CN' }
  },
  {
    name: 'metadata versions',
    request: (api, signal) => api.getMetaVersions({ signal }),
    path: '/api/meta/versions',
    query: {}
  },
  {
    name: 'flex versions',
    request: (api, signal) => api.getChampionVersions('global', 'flex', { signal }),
    path: '/api/global/champions/flex/versions',
    query: {}
  },
  {
    name: 'flex overview',
    request: (api, signal) =>
      api.getRankedChampions('global', {
        queue: 'flex',
        tier: 'emerald_plus',
        version: '16.20',
        signal
      }),
    path: '/api/global/champions/flex',
    query: { tier: 'emerald_plus', version: '16.20' }
  },
  {
    name: 'flex details with item progression',
    request: (api, signal) =>
      api.getRankedChampion('global', 777, 'top', {
        queue: 'flex',
        tier: 'emerald_plus',
        version: '16.20',
        isMore: true,
        signal
      }),
    path: '/api/global/champions/flex/777/top',
    query: { tier: 'emerald_plus', version: '16.20', is_more: 'true' }
  },
  {
    name: 'flex counters',
    request: (api, signal) =>
      api.getRankedChampionCounters('global', 777, 'top', {
        queue: 'flex',
        tier: 'emerald_plus',
        version: '16.20',
        signal
      }),
    path: '/api/global/champions/flex/777/top/counters',
    query: { tier: 'emerald_plus', version: '16.20' }
  },
  {
    name: 'ranked counters',
    request: (api, signal) =>
      api.getRankedChampionCounters('global', 777, 'top', {
        tier: 'master',
        version: '16.20',
        signal
      }),
    path: '/api/global/champions/ranked/777/top/counters',
    query: { tier: 'master', version: '16.20' }
  },
  {
    name: 'doom overview',
    request: (api, signal) =>
      api.getDoomChampions('global', { tier: 'all', version: '15.17', signal }),
    path: '/api/global/champions/doom',
    query: { tier: 'all', version: '15.17' }
  },
  {
    name: 'doom details',
    request: (api, signal) =>
      api.getDoomChampion('global', 122, { tier: 'platinum_plus', version: '15.17', signal }),
    path: '/api/global/champions/doom/122/none',
    query: { tier: 'platinum_plus', version: '15.17' }
  },
  {
    name: 'doom versions',
    request: (api, signal) => api.getChampionVersions('global', 'doom', { signal }),
    path: '/api/global/champions/doom/versions',
    query: {}
  },
  {
    name: 'arena overview',
    request: (api, signal) =>
      api.getArenaChampions('global', { tier: 'all', version: '16.20', signal }),
    path: '/api/global/champions/arena',
    query: { tier: 'all', version: '16.20' }
  },
  {
    name: 'arena details',
    request: (api, signal) =>
      api.getArenaChampion('global', 50, { tier: 'all', version: '16.20', signal }),
    path: '/api/global/champions/arena/50',
    query: { tier: 'all', version: '16.20' }
  },
  {
    name: 'champion metadata',
    request: (api, signal) => api.getMetaChampions({ locale: 'zh_CN', signal }),
    path: '/api/meta/champions',
    query: { hl: 'zh_CN' }
  },
  {
    name: 'item metadata',
    request: (api, signal) => api.getMetaItems({ locale: 'zh_CN', version: '13.23', signal }),
    path: '/api/meta/items',
    query: { hl: 'zh_CN', version: '13.23' }
  },
  {
    name: 'rune metadata',
    request: (api, signal) => api.getMetaRunes({ locale: 'zh_CN', version: '16.19', signal }),
    path: '/api/meta/runes',
    query: { hl: 'zh_CN', version: '16.19' }
  },
  {
    name: 'stat shard metadata',
    request: (api, signal) => api.getMetaStatMods({ locale: 'zh_CN', version: '16.19', signal }),
    path: '/api/meta/stat-mods',
    query: { hl: 'zh_CN', version: '16.19' }
  }
]

describe('OP.GG captured request contracts', () => {
  it('uses the desktop service for jungle clear rankings and preserves pagination', async () => {
    const signal = new AbortController().signal
    const raw = { content: [], number: 1, empty: true }
    const http = axios.create({
      adapter: async (config) => {
        const url = new URL(http.getUri(config))

        expect(url.origin).toBe('https://desktop-api.op.gg')
        expect(url.pathname).toBe('/timer/jungle-fullcamps')
        expect(Object.fromEntries(url.searchParams)).toEqual({
          page: '1',
          queueId: '420',
          timeFrom: '171000',
          championId: '64',
          region: 'kr'
        })
        expect(config.signal).toBe(signal)

        return { data: raw, status: 200, statusText: 'OK', headers: {}, config }
      }
    })

    const response = await new OpggDesktopHttpApiAxiosHelper(http).getJungleFullCamps({
      page: 1,
      queueId: 420,
      timeFrom: 171000,
      championId: 64,
      region: 'kr',
      signal
    })

    expect(response.data).toBe(raw)
  })

  it.each(capturedRequests)('sends $name without changing the raw response', async (sample) => {
    const signal = new AbortController().signal
    const raw = { data: [{ id: 777, upstreamField: 'retained' }], meta: { version: '16.20' } }
    const http = axios.create({
      adapter: async (config) => {
        const url = new URL(http.getUri(config))
        expect(config.method).toBe('get')
        expect(config.signal).toBe(signal)
        expect(url.origin).toBe('https://lol-api-champion.op.gg')
        expect(url.pathname).toBe(sample.path)
        expect(Object.fromEntries(url.searchParams)).toEqual(sample.query)

        return { data: raw, status: 200, statusText: 'OK', headers: {}, config }
      }
    })

    const response = await sample.request(new OpggHttpApiAxiosHelper(http), signal)
    expect(response.data).toBe(raw)
  })

  it.each([undefined, false, true])('preserves the ranked isMore option: %s', async (isMore) => {
    const http = axios.create({
      baseURL: 'akari://opgg',
      adapter: async (config) => {
        const url = new URL(http.getUri(config))
        expect(url.protocol).toBe('akari:')
        expect(url.host).toBe('opgg')
        expect(url.pathname).toBe('/api/global/champions/ranked/777/top')
        expect(Object.fromEntries(url.searchParams)).toEqual({
          tier: 'master',
          ...(isMore === undefined ? {} : { is_more: String(isMore) })
        })

        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }
    })

    await new OpggHttpApiAxiosHelper(http).getRankedChampion('global', 777, 'top', {
      tier: 'master',
      isMore
    })
  })

  it('omits unspecified metadata parameters so the server selects the current version', async () => {
    const http = axios.create({
      adapter: async (config) => {
        expect(http.getUri(config)).toBe('https://lol-api-champion.op.gg/api/meta/items')

        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }
    })

    await new OpggHttpApiAxiosHelper(http).getMetaItems()
  })
})
