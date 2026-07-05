import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import type { AxiosRequestConfig } from 'axios'

import { AkariProtocolMain } from '../akari-protocol'
import { type RiotClientMainContext, RiotClientRcuUninitializedError } from './context'

export class RiotClientProtocolController {
  constructor(private readonly context: RiotClientMainContext) {}

  register() {
    const { logger, protocol, riotClient } = this.context

    protocol.registerDomain('riot-client', async (uri, req, context) => {
      const reqHeaders: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })
      delete reqHeaders[AKARI_PROXY_REQUEST_ID_HEADER]

      try {
        const config: AxiosRequestConfig = {
          method: req.method,
          url: uri,
          data: req.body ? AkariProtocolMain.convertWebStreamToNodeStream(req.body) : undefined,
          validateStatus: () => true,
          responseType: 'stream',
          headers: reqHeaders,
          signal: context.signal
        }

        const res = await riotClient.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        logger.warn(`Failed to RiotClient request`, error)

        if (error instanceof RiotClientRcuUninitializedError) {
          return new Response(JSON.stringify({ error: error.name }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          })
        }

        return new Response((error as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }
}
