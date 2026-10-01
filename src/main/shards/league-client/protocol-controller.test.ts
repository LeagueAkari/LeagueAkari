import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { describe, expect, it, vi } from 'vitest'

import type { AkariProtocolDomainHandler } from '../akari-protocol/context'
import { LeagueClientLcuUninitializedError, type LeagueClientMainContext } from './context'
import { LeagueClientProtocolController } from './protocol-controller'

vi.mock('../akari-protocol', () => ({
  AkariProtocolMain: {
    shouldNotHaveBody: (status: number) => [204, 205, 304].includes(status)
  }
}))

function createProtocol() {
  let handler: AkariProtocolDomainHandler
  const request = vi.fn()
  const unregisterDomain = vi.fn()
  const controller = new LeagueClientProtocolController({
    protocol: {
      registerDomain: (_domain: string, value: AkariProtocolDomainHandler) => {
        handler = value
      },
      unregisterDomain
    },
    leagueClient: { request },
    logger: { warn: vi.fn() }
  } as unknown as LeagueClientMainContext)
  controller.register()

  return {
    controller,
    request,
    unregisterDomain,
    handle: (...args: Parameters<AkariProtocolDomainHandler>) => handler(...args)
  }
}

describe('LeagueClient protocol proxy', () => {
  it('forwards cancellation and response status while removing the internal request ID', async () => {
    const protocol = createProtocol()
    const abort = new AbortController()
    protocol.request.mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
      headers: { 'content-type': 'application/json' },
      data: '{"error":"missing"}'
    })

    const response = await protocol.handle(
      '/lol-summoner/v1/current-summoner',
      new Request('https://localhost/summoner', {
        headers: { [AKARI_PROXY_REQUEST_ID_HEADER]: 'test-request', accept: 'application/json' }
      }),
      { signal: abort.signal }
    )

    expect(protocol.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/lol-summoner/v1/current-summoner',
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: abort.signal,
        responseType: 'stream'
      })
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'missing' })

    protocol.controller.dispose()
    expect(protocol.unregisterDomain).toHaveBeenCalledWith('league-client')
  })

  it('returns 503 when no LCU connection is initialized', async () => {
    const protocol = createProtocol()
    protocol.request.mockRejectedValue(new LeagueClientLcuUninitializedError())

    const response = await protocol.handle('/test', new Request('https://localhost/test'), {})

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'LeagueClientLcuUninitializedError' })
  })
})
