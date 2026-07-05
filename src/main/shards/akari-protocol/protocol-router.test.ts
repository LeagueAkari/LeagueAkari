import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AkariProtocolRouter } from './protocol-router'
import { AKARI_PROXY_REQUEST_ID_HEADER } from './proxy-request-cancellation'

const handle = vi.fn()
const unhandle = vi.fn()

vi.mock('electron', () => ({
  session: {
    fromPartition: vi.fn(() => ({
      protocol: {
        handle,
        unhandle
      }
    }))
  }
}))

describe('AkariProtocolRouter proxy request cancellation', () => {
  beforeEach(() => {
    handle.mockReset()
    unhandle.mockReset()
  })

  test('passes an abortable proxy signal to domain handlers', async () => {
    const router = new AkariProtocolRouter()
    let handlerStarted!: () => void
    const started = new Promise<void>((resolve) => {
      handlerStarted = resolve
    })
    let handlerSignal: AbortSignal | undefined

    router.registerDomain('league-client', async (_uri, _request, context) => {
      handlerSignal = context.signal
      handlerStarted()

      return new Promise<Response>((resolve) => {
        context.signal?.addEventListener(
          'abort',
          () => resolve(new Response('aborted', { status: 499 })),
          { once: true }
        )
      })
    })
    router.registerPartition('persist:test')

    const protocolHandler = handle.mock.calls[0][1] as (request: Request) => Promise<Response>
    const responsePromise = protocolHandler(
      new Request('akari://league-client/lol-gameflow/v1/session', {
        headers: {
          [AKARI_PROXY_REQUEST_ID_HEADER]: 'request-1'
        }
      })
    )

    await started

    expect(handlerSignal?.aborted).toBe(false)
    expect(router.cancelProxyRequest('request-1')).toBe(true)

    const response = await responsePromise

    expect(handlerSignal?.aborted).toBe(true)
    expect(response.status).toBe(499)
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })
})
