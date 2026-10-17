import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { AkariProtocolDomainHandler } from './context'
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

function setup(handler: AkariProtocolDomainHandler, signal?: AbortSignal, requestId = 'request-1') {
  const router = new AkariProtocolRouter()
  router.registerDomain('sgp', handler)
  router.registerPartition('persist:test')

  const protocolHandler = handle.mock.calls[0][1] as (request: Request) => Promise<Response>
  const request = new Request('akari://sgp/slow', {
    signal,
    headers: requestId ? { [AKARI_PROXY_REQUEST_ID_HEADER]: requestId } : {}
  })

  return { router, response: protocolHandler(request) }
}

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

  test('keeps cancellation active after headers and aborts an unfinished response body', async () => {
    const cancelBody = vi.fn()
    let signal: AbortSignal | undefined
    const { router, response } = setup((_uri, _request, context) => {
      signal = context.signal

      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('first chunk'))
          },

          cancel: cancelBody
        })
      )
    })

    const reader = (await response).body!.getReader()
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('first chunk')
    const nextChunk = reader.read()
    const cancelledRead = expect(nextChunk).rejects.toMatchObject({ name: 'AbortError' })

    expect(router.cancelProxyRequest('request-1')).toBe(true)

    await cancelledRead
    expect(signal?.aborted).toBe(true)
    expect(cancelBody).toHaveBeenCalledOnce()
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })

  test('preserves response metadata and bytes and releases cancellation after completion', async () => {
    let signal: AbortSignal | undefined
    const bytes = new Uint8Array([0, 128, 255])
    const { router, response } = setup((_uri, _request, context) => {
      signal = context.signal

      return new Response(bytes, {
        status: 206,
        statusText: 'Partial Content',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Upstream': 'preserved' }
      })
    })

    const result = await response
    expect(result.status).toBe(206)
    expect(result.statusText).toBe('Partial Content')
    expect(result.headers.get('X-Upstream')).toBe('preserved')
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes)

    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(router.cancelProxyRequest('request-1')).toBe(false)
    expect(signal?.aborted).toBe(false)
  })

  test('propagates downstream cancellation upstream without a request id', async () => {
    const cancelBody = vi.fn()
    let signal: AbortSignal | undefined
    const { response } = setup(
      (_uri, _request, context) => {
        signal = context.signal

        return new Response(new ReadableStream({ cancel: cancelBody }))
      },
      undefined,
      ''
    )
    const reason = new Error('reader stopped')

    await (await response).body!.cancel(reason)

    await vi.waitFor(() => expect(signal?.aborted).toBe(true))
    expect(signal?.reason).toBe(reason)
    expect(cancelBody).toHaveBeenCalledWith(reason)
  })

  test('aborts upstream before waiting for its asynchronous body cancellation', async () => {
    let signal: AbortSignal | undefined
    const cancelBody = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          if (signal?.aborted) {
            resolve()
            return
          }

          signal?.addEventListener('abort', () => resolve(), { once: true })
        })
    )
    const { response } = setup((_uri, _request, context) => {
      signal = context.signal

      return new Response(new ReadableStream({ cancel: cancelBody }))
    })

    await (await response).body!.cancel('reader stopped')

    await vi.waitFor(() => expect(signal?.aborted).toBe(true))
    expect(cancelBody).toHaveBeenCalledOnce()
  })

  test('propagates the native request abort while the response is streaming', async () => {
    const controller = new AbortController()
    const cancelBody = vi.fn()
    let signal: AbortSignal | undefined
    const { response } = setup(
      (_uri, _request, context) => {
        signal = context.signal

        return new Response(new ReadableStream({ cancel: cancelBody }))
      },
      controller.signal,
      ''
    )
    const reader = (await response).body!.getReader()
    const cancelledRead = expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' })

    controller.abort()

    await cancelledRead
    expect(signal?.aborted).toBe(true)
    expect(cancelBody).toHaveBeenCalledOnce()
  })

  test('forwards body errors and releases the upstream request', async () => {
    let signal: AbortSignal | undefined
    let source!: ReadableStreamDefaultController
    const { router, response } = setup((_uri, _request, context) => {
      signal = context.signal

      return new Response(
        new ReadableStream({
          start(controller) {
            source = controller
          }
        })
      )
    })
    const reader = (await response).body!.getReader()
    const error = new Error('upstream connection lost')
    const failedRead = expect(reader.read()).rejects.toBe(error)

    source.error(error)

    await failedRead
    await vi.waitFor(() => expect(signal?.aborted).toBe(true))
    expect(signal?.reason).toBe(error)
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })

  test('cleans up immediately for a response without a body', async () => {
    const { router, response } = setup(() => new Response(null, { status: 204 }))

    const result = await response

    expect(result.status).toBe(204)
    expect(result.body).toBeNull()
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })

  test('cleans up and preserves an error thrown before headers', async () => {
    const error = new Error('upstream request failed')
    const { router, response } = setup(() => {
      throw error
    })

    await expect(response).rejects.toBe(error)
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })

  test('does not start an already aborted request', async () => {
    const controller = new AbortController()
    controller.abort()
    const handler = vi.fn(() => new Response('unexpected'))
    const { router, response } = setup(handler, controller.signal)

    await expect(response).rejects.toMatchObject({ name: 'AbortError' })
    expect(handler).not.toHaveBeenCalled()
    expect(router.cancelProxyRequest('request-1')).toBe(false)
  })
})
