import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { describe, expect, it, vi } from 'vitest'

import type { AkariProtocolDomainHandler } from '../akari-protocol/context'
import { AkariApiProtocolController } from './protocol-controller'

vi.mock('../akari-protocol', () => ({
  AkariProtocolMain: {
    convertWebStreamToNodeStream: vi.fn(),
    shouldNotHaveBody: (status: number) => status === 204 || status === 304
  }
}))

describe('Akari API protocol controller', () => {
  it('proxies both service domains through their bootstrap HTTP clients', async () => {
    const handlers = new Map<string, AkariProtocolDomainHandler>()
    const protocol = {
      registerDomain: vi.fn((domain: string, handler: AkariProtocolDomainHandler) => {
        handlers.set(domain, handler)
      }),
      unregisterDomain: vi.fn()
    }
    const apiRequest = vi.fn().mockResolvedValue({
      data: JSON.stringify({ ok: true }),
      headers: { 'content-type': 'application/json' },
      status: 200,
      statusText: 'OK'
    })
    const bootstrap = {
      apiHttp: { request: apiRequest },
      staticHttp: { request: vi.fn() }
    }
    const controller = new AkariApiProtocolController(
      protocol as never,
      { warn: vi.fn() } as never,
      bootstrap as never
    )

    controller.register()

    expect([...handlers.keys()]).toEqual(['akari-api', 'akari-static'])

    const signal = new AbortController().signal
    const response = await handlers.get('akari-api')!(
      'notice/v1/latest?lang=en',
      new Request('akari://akari-api/notice/v1/latest?lang=en', {
        headers: {
          [AKARI_PROXY_REQUEST_ID_HEADER]: 'request-id',
          'x-test': 'test'
        }
      }),
      { signal }
    )

    expect(apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'x-test': 'test' },
        method: 'GET',
        signal,
        url: 'notice/v1/latest?lang=en',
        validateStatus: expect.any(Function)
      })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })

    controller.unregister()

    expect(protocol.unregisterDomain).toHaveBeenNthCalledWith(1, 'akari-api')
    expect(protocol.unregisterDomain).toHaveBeenNthCalledWith(2, 'akari-static')
  })
})
