import { describe, expect, it, vi } from 'vitest'

import type { AkariProtocolDomainHandler } from '../akari-protocol/context'
import { createNetworkAxiosClient } from '../network/axios-client'
import type { NetworkSession } from '../network/context'
import { ChampionDataProtocolController } from './protocol-controller'

function setup(enabled = true, status = 200) {
  const handlers = new Map<string, AkariProtocolDomainHandler>()
  const fetch = vi.fn(
    async (_request: Request) =>
      new Response(JSON.stringify({ data: ['16.17'] }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      })
  )
  const controller = new ChampionDataProtocolController(
    { featureGating: { getEvaluation: () => ({ enabled }) }, logger: { warn: vi.fn() } } as never,
    {
      registerDomain: (domain: string, handler: AkariProtocolDomainHandler) =>
        handlers.set(domain, handler)
    } as never,
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
  return { handlers, fetch }
}

describe('champion data protocol forwarding', () => {
  it('keeps upstream cancellation active until the JSON body is complete', async () => {
    const { handlers, fetch } = setup()
    const abort = vi.fn()
    fetch.mockImplementationOnce(
      async (request) =>
        new Response(
          new ReadableStream({
            start(controller) {
              request.signal.addEventListener('abort', () => {
                abort()
                controller.error(request.signal.reason)
              })
            }
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
    )
    const controller = new AbortController()
    const pending = handlers.get('opgg')!('slow', new Request('akari://opgg/slow'), {
      signal: controller.signal
    })
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    controller.abort()
    expect((await pending).status).toBe(502)
    expect(abort).toHaveBeenCalledOnce()
  })

  it('blocks a disabled source before making an external request', async () => {
    const { handlers, fetch } = setup(false)
    const response = await handlers.get('qq101')!(
      'go/database/versionlist',
      new Request('akari://qq101/go/database/versionlist'),
      {}
    )
    expect(response.status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves an upstream HTTP error for the renderer helper', async () => {
    const { handlers, fetch } = setup(true, 404)
    const response = await handlers.get('qq101')!(
      'missing',
      new Request('akari://qq101/missing'),
      {}
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ data: ['16.17'] })
    expect(fetch).toHaveBeenCalledOnce()
  })
})
