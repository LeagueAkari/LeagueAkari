import { formatError } from '@shared/utils/errors'
import type { AxiosRequestConfig } from 'axios'

import { AkariProtocolMain } from '../akari-protocol'
import type { SgpMainContext } from './context'

export class SgpProtocolController {
  constructor(private readonly context: SgpMainContext) {}

  register() {
    const { httpClient, logger, protocol } = this.context

    protocol.registerDomain('sgp', async (uri, req) => {
      const reqHeaders: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })

      try {
        const config: AxiosRequestConfig = {
          method: req.method,
          url: uri,
          data: req.body ? AkariProtocolMain.convertWebStreamToNodeStream(req.body) : undefined,
          headers: reqHeaders,
          validateStatus: () => true,
          responseType: 'stream'
        }

        const res = await httpClient.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        logger.warn(`Failed to proxy SGP request`, error)

        return new Response(formatError(error), {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }
}
