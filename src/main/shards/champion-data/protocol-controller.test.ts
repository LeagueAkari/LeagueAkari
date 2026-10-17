import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AkariProtocolRouter } from '../akari-protocol/protocol-router'
import { createNetworkAxiosClient } from '../network/axios-client'
import type { NetworkSession } from '../network/context'
import { ChampionDataProtocolController } from './protocol-controller'

const handle = vi.fn()

vi.mock('electron', () => ({
  session: {
    fromPartition: vi.fn(() => ({ protocol: { handle } }))
  }
}))

function setup(enabled = true, status = 200) {
  const router = new AkariProtocolRouter()
  const fetch = vi.fn(
    async (request: Request) =>
      new Response(
        request.method === 'HEAD' || [204, 205, 304].includes(status)
          ? null
          : JSON.stringify({ data: ['16.17'] }),
        {
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
  )

  const controller = new ChampionDataProtocolController(
    { featureGating: { getEvaluation: () => ({ enabled }) }, logger: { warn: vi.fn() } } as never,
    router as never,
    {
      createAxiosClient: (defaults: Parameters<typeof createNetworkAxiosClient>[2]) =>
        createNetworkAxiosClient(
          { fetch } as unknown as NetworkSession,
          async () => undefined,
          defaults
        )
    } as never
  )
  controller.register()
  router.registerPartition('test:champion-data')
  const protocolHandler = handle.mock.calls[0][1] as (request: Request) => Promise<Response>

  return {
    router,
    fetch,
    request: (url: string, init?: RequestInit) => protocolHandler(new Request(url, init))
  }
}

describe('champion data protocol forwarding', () => {
  beforeEach(() => {
    handle.mockReset()
  })

  it('forwards JSON before completion and cancels upstream while the body is streaming', async () => {
    const { router, request, fetch } = setup()
    const abort = vi.fn()
    fetch.mockImplementationOnce(
      async (request) =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{"data":'))
              request.signal.addEventListener('abort', () => {
                abort()
                controller.error(request.signal.reason)
              })
            }
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
    )
    const response = await request('akari://opgg/slow', {
      headers: { [AKARI_PROXY_REQUEST_ID_HEADER]: 'slow-json' }
    })
    const reader = response.body!.getReader()
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('{"data":')
    const cancelledRead = expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' })

    expect(router.cancelProxyRequest('slow-json')).toBe(true)

    await cancelledRead
    expect(abort).toHaveBeenCalledOnce()
    expect(router.cancelProxyRequest('slow-json')).toBe(false)
  })

  it('blocks a disabled source before making an external request', async () => {
    const { request, fetch } = setup(false)
    const response = await request('akari://qq101/go/database/versionlist')

    expect(response.status).toBe(403)
    expect(await response.text()).toBe('Data source is disabled')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves an upstream HTTP error for the renderer helper', async () => {
    const { request, fetch } = setup(true, 404)
    const response = await request('akari://qq101/missing')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ data: ['16.17'] })
    expect(fetch).toHaveBeenCalledOnce()
  })

  it.each([
    { method: 'HEAD', status: 200 },
    { method: 'GET', status: 204 },
    { method: 'GET', status: 205 },
    { method: 'GET', status: 304 }
  ])('forwards $method $status without a response body', async ({ method, status }) => {
    const { router, request } = setup(true, status)
    const response = await request('akari://qq101/empty', {
      method,
      headers: { [AKARI_PROXY_REQUEST_ID_HEADER]: 'empty-response' }
    })

    expect(response.status).toBe(status)
    expect(response.body).toBeNull()
    expect(router.cancelProxyRequest('empty-response')).toBe(false)
  })
})
