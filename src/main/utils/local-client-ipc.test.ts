import { describe, expect, it, vi } from 'vitest'

import { LeagueClientIpcHandlers } from '../shards/league-client/ipc-handlers'
import { RiotClientIpcHandlers } from '../shards/riot-client/ipc-handlers'

type HandlerConstructor = new (context: any) => { register(): void }

function setupRequestHandler(Handler: HandlerConstructor, clientKey: string) {
  const requestHandlers: Array<(event: unknown, config: { url?: string }) => Promise<unknown>> = []
  const requestForRenderer = vi.fn(async () => ({ status: 200 }))
  const context = {
    namespace: `${clientKey}-main`,
    ipc: {
      onCall: vi.fn(
        (
          _namespace: string,
          channel: string,
          handler: (event: unknown, config: { url?: string }) => Promise<unknown>
        ) => {
          if (channel === 'http-request') {
            requestHandlers.push(handler)
          }
        }
      )
    },
    [clientKey]: { requestForRenderer }
  }

  new Handler(context).register()
  const requestHandler = requestHandlers[0]
  if (!requestHandler) {
    throw new Error('HTTP request handler was not registered')
  }

  return { requestForRenderer, requestHandler }
}

describe.each([
  ['League Client', LeagueClientIpcHandlers, 'leagueClient'],
  ['Riot Client', RiotClientIpcHandlers, 'riotClient']
] as const)('%s renderer request proxy', (_name, Handler, clientKey) => {
  it('rejects an absolute URL before reaching the local TLS client', async () => {
    const { requestForRenderer, requestHandler } = setupRequestHandler(Handler, clientKey)

    await expect(requestHandler({}, { url: 'https://example.test/not-local' })).rejects.toThrow(
      'Local client requests require a relative URL'
    )
    expect(requestForRenderer).not.toHaveBeenCalled()
  })

  it('forwards a relative local endpoint', async () => {
    const { requestForRenderer, requestHandler } = setupRequestHandler(Handler, clientKey)
    const config = { url: '/riotclient/auth-token' }

    await expect(requestHandler({}, config)).resolves.toEqual({ status: 200 })
    expect(requestForRenderer).toHaveBeenCalledWith(config)
  })
})
