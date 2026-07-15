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

  it('maps release, last-resort, and statistics methods to the Akari API', () => {
    const { get, http, post } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    api.getRelease('1.5.0', 'en')
    api.getLastResortLatestRelease()
    api.postStatisticsRecord('1.5.0')

    expect(get).toHaveBeenNthCalledWith(1, '/releases/v1/1.5.0', {
      params: { lang: 'en' },
      signal: undefined
    })
    expect(get).toHaveBeenNthCalledWith(2, '/last-resort/v1/latest-release', {
      signal: undefined
    })
    expect(post).toHaveBeenCalledWith(
      '/statistics/v1/records',
      { version: '1.5.0' },
      { signal: undefined }
    )
  })
})
