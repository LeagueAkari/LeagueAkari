import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { formatError } from '@shared/utils/errors'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

import { AkariProtocolMain } from '../akari-protocol'
import type { AkariLogger } from '../logger-factory'
import type { AkariApiBootstrapController } from './bootstrap-controller'

const AKARI_API_PROTOCOL_DOMAIN = 'akari-api'
const AKARI_STATIC_PROTOCOL_DOMAIN = 'akari-static'

export class AkariApiProtocolController {
  constructor(
    private readonly _protocol: AkariProtocolMain,
    private readonly _logger: AkariLogger,
    private readonly _bootstrap: AkariApiBootstrapController
  ) {}

  register() {
    this._registerDomain(AKARI_API_PROTOCOL_DOMAIN, this._bootstrap.apiHttp)
    this._registerDomain(AKARI_STATIC_PROTOCOL_DOMAIN, this._bootstrap.staticHttp)
  }

  unregister() {
    this._protocol.unregisterDomain(AKARI_API_PROTOCOL_DOMAIN)
    this._protocol.unregisterDomain(AKARI_STATIC_PROTOCOL_DOMAIN)
  }

  private _registerDomain(domain: string, httpClient: AxiosInstance) {
    this._protocol.registerDomain(domain, async (uri, request, context) => {
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key] = value
      })
      delete headers[AKARI_PROXY_REQUEST_ID_HEADER]

      try {
        const config: AxiosRequestConfig = {
          method: request.method,
          url: uri,
          data: request.body
            ? AkariProtocolMain.convertWebStreamToNodeStream(request.body)
            : undefined,
          headers,
          responseType: 'stream',
          signal: context.signal,
          validateStatus: () => true
        }
        const response = await httpClient.request(config)
        const responseHeaders = Object.fromEntries(
          Object.entries(response.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(
          AkariProtocolMain.shouldNotHaveBody(response.status) ? null : response.data,
          {
            headers: responseHeaders,
            status: response.status,
            statusText: response.statusText
          }
        )
      } catch (error) {
        this._logger.warn(`Failed to proxy ${domain} request`, error)

        return new Response(formatError(error), {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }
}
