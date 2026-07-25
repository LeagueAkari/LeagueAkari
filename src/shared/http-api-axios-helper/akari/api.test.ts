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

    api.getConfig('app/feature-gates')

    expect(get).toHaveBeenCalledWith('/config/v1/app/feature-gates', {
      signal: undefined
    })
  })

  it('maps contact channels to the public website content path', () => {
    const { get, http } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    api.getContactChannels()

    expect(get).toHaveBeenCalledWith('/website/v1/contact-channels', {
      signal: undefined
    })
  })

  it('maps statistics records to the Akari API', () => {
    const { http, post } = createHttpMock()
    const api = new AkariApiHttpApiAxiosHelper(http)

    api.postStatisticsRecord('1.5.0')

    expect(post).toHaveBeenCalledWith(
      '/statistics/v1/records',
      { version: '1.5.0' },
      { signal: undefined }
    )
  })
})
