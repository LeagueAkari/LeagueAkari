import axios, { type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { OpggHttpApiAxiosHelper } from '.'

// Request contracts captured in opgg2.chls or verified live on 2026-10-18.
const capturedRequests: {
  name: string
  request: (api: OpggHttpApiAxiosHelper, signal: AbortSignal) => Promise<AxiosResponse<unknown>>
  path: string
  query: Record<string, string>
}[] = [
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
