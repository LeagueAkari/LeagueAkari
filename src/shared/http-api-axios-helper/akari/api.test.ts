import type { AxiosInstance } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { AkariApiHttpApiAxiosHelper } from './api'

function createHttpMock() {
  const get = vi.fn().mockResolvedValue({ data: {} })
  const post = vi.fn().mockResolvedValue({ data: {} })
  const http = {
    defaults: { baseURL: undefined },
    get,
    post
  } as unknown as AxiosInstance

  return { get, http, post }
}

describe('Akari API HTTP helper', () => {
  it('uses Chinese for notice and release requests by default', () => {
    const { get, http } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    api.getLatestNotice()
    api.getLatestRelease()

    expect(get).toHaveBeenNthCalledWith(1, '/notice/v1/latest', {
      params: { lang: 'zh-CN' },
      signal: undefined
    })
    expect(get).toHaveBeenNthCalledWith(2, '/releases/v1/latest', {
      params: { lang: 'zh-CN' },
      signal: undefined
    })
  })

  it('maps each allowlisted config resource to its API path', () => {
    const { get, http } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    api.getConfig('sgp/league-servers')

    expect(get).toHaveBeenCalledWith('/config/v1/sgp/league-servers', {
      signal: undefined
    })
  })

  it.each(['v1.5.0', 'latest', '1.5', '01.5.0', 'not-a-version'])(
    'rejects a non-canonical release version: %s',
    (version) => {
      const { http } = createHttpMock()
      const api = new AkariApiHttpApiAxiosHelper(http)

      expect(() => api.getRelease(version)).toThrow(
        'Akari release version must be a canonical semantic version without v'
      )
    }
  )

  it('rejects languages and config resources outside the public API contract', () => {
    const { http } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    expect(() => api.getLatestNotice('ja' as never)).toThrow('Unsupported Akari API language')
    expect(() => api.getConfig('templates/catalog' as never)).toThrow(
      'Unsupported Akari API config resource'
    )
  })
})
