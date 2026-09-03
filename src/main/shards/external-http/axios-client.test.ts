import type { AxiosRetry } from 'axios-retry'
import { describe, expect, it, vi } from 'vitest'

import { createExternalHttpAxiosClient } from './axios-client'
import type { ExternalHttpSession } from './context'

const axiosRetry = require('axios-retry').default as AxiosRetry

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('createExternalHttpAxiosClient', () => {
  it('waits for proxy configuration and uses the Electron session fetch', async () => {
    let resolveConfiguration!: () => void
    const configured = new Promise<void>((resolve) => {
      resolveConfiguration = resolve
    })
    const fetch = vi.fn(async (_input: URL | Request | string, _init?: RequestInit) =>
      jsonResponse({ ok: true })
    )
    const client = createExternalHttpAxiosClient(
      { fetch } as unknown as ExternalHttpSession,
      () => configured,
      {
        baseURL: 'https://example.com',
        headers: { 'X-Akari-Test': 'yes' }
      }
    )

    const pending = client.get('/data', { params: { mode: 'ranked' } })
    await Promise.resolve()
    expect(fetch).not.toHaveBeenCalled()

    resolveConfiguration()
    await expect(pending).resolves.toMatchObject({ data: { ok: true } })

    const request = fetch.mock.calls[0][0] as Request
    expect(request.url).toBe('https://example.com/data?mode=ranked')
    expect(request.headers.get('X-Akari-Test')).toBe('yes')
  })

  it('forwards cancellation to the Electron request signal', async () => {
    let requestSignal: AbortSignal | undefined
    const fetch = vi.fn((input: URL | Request | string, _init?: RequestInit) => {
      requestSignal = (input as Request).signal
      return new Promise<Response>((_, reject) => {
        requestSignal?.addEventListener('abort', () => reject(requestSignal?.reason), {
          once: true
        })
      })
    })
    const client = createExternalHttpAxiosClient(
      { fetch } as unknown as ExternalHttpSession,
      async () => undefined,
      { baseURL: 'https://example.com' }
    )
    const controller = new AbortController()

    const pending = client.get('/slow', { signal: controller.signal })
    await vi.waitFor(() => expect(requestSignal).toBeDefined())
    controller.abort()

    await expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(requestSignal?.aborted).toBe(true)
  })

  it('remains compatible with the champion-data retry policy', async () => {
    const fetch = vi
      .fn<ExternalHttpSession['fetch']>()
      .mockRejectedValueOnce(new TypeError('network failure'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const client = createExternalHttpAxiosClient(
      { fetch } as unknown as ExternalHttpSession,
      async () => undefined,
      { baseURL: 'https://example.com', timeout: 8_000 }
    )
    axiosRetry(client, {
      retries: 1,
      shouldResetTimeout: true,
      retryDelay: () => 0,
      retryCondition: axiosRetry.isNetworkOrIdempotentRequestError
    })

    await expect(client.get('/retry')).resolves.toMatchObject({ data: { ok: true } })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(client.defaults.timeout).toBe(8_000)
  })
})
