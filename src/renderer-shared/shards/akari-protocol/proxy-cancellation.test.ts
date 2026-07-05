import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import axios, { type AxiosAdapter, AxiosHeaders } from 'axios'
import { describe, expect, test, vi } from 'vitest'

import { installAkariProtocolProxyCancellation } from './proxy-cancellation'

describe('installAkariProtocolProxyCancellation', () => {
  test('adds a lower-case proxy request id header and cancels main request on abort', async () => {
    let resolveAdapter!: () => void
    const adapterStarted = new Promise<void>((resolve) => {
      resolveAdapter = resolve
    })
    let capturedHeaders: AxiosHeaders | undefined

    const adapter: AxiosAdapter = async (config) => {
      capturedHeaders = AxiosHeaders.from(config.headers)
      await adapterStarted

      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: 'OK'
      }
    }
    const httpClient = axios.create({
      adapter,
      baseURL: 'akari://league-client'
    })
    const cancelProxyRequest = vi.fn().mockResolvedValue(true)

    installAkariProtocolProxyCancellation(httpClient, {
      cancelProxyRequest
    })

    const controller = new AbortController()
    const request = httpClient.get('/lol-gameflow/v1/session', {
      signal: controller.signal
    })

    await vi.waitFor(() => {
      expect(capturedHeaders?.get(AKARI_PROXY_REQUEST_ID_HEADER)).toEqual(expect.any(String))
    })

    const requestId = capturedHeaders!.get(AKARI_PROXY_REQUEST_ID_HEADER) as string
    expect(Object.keys(capturedHeaders!.toJSON())).toContain(AKARI_PROXY_REQUEST_ID_HEADER)

    controller.abort()
    await vi.waitFor(() => {
      expect(cancelProxyRequest).toHaveBeenCalledWith(requestId)
    })

    resolveAdapter()
    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' })
  })

  test('does not add cancellation metadata for requests without signal', async () => {
    let capturedHeaders: AxiosHeaders | undefined
    const httpClient = axios.create({
      adapter: async (config) => {
        capturedHeaders = AxiosHeaders.from(config.headers)

        return {
          config,
          data: null,
          headers: {},
          status: 200,
          statusText: 'OK'
        }
      },
      baseURL: 'akari://league-client'
    })
    const cancelProxyRequest = vi.fn().mockResolvedValue(true)

    installAkariProtocolProxyCancellation(httpClient, {
      cancelProxyRequest
    })

    await httpClient.get('/lol-gameflow/v1/session')

    expect(capturedHeaders?.has(AKARI_PROXY_REQUEST_ID_HEADER)).toBe(false)
    expect(cancelProxyRequest).not.toHaveBeenCalled()
  })
})
