import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import { isAbortError } from '@shared/utils/queue-keeper'
import { type AxiosInstance, type AxiosResponse, isAxiosError } from 'axios'
import type { AxiosRetry } from 'axios-retry'

import type { AkariProtocolMain } from '../akari-protocol'
import type { NetworkMain } from '../network'
import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE,
  type ChampionDataMainContext
} from './context'

const axiosRetry = require('axios-retry').default as AxiosRetry

export class ChampionDataProtocolController {
  readonly opggApi: OpggHttpApiAxiosHelper
  private readonly _opggHttp: AxiosInstance
  private readonly _qq101Http: AxiosInstance

  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _protocol: AkariProtocolMain,
    network: NetworkMain
  ) {
    this._opggHttp = network.createAxiosClient({
      baseURL: OpggHttpApiAxiosHelper.BASE_URL,
      timeout: 8_000
    })
    this._qq101Http = network.createAxiosClient({
      baseURL: Qq101HttpApiAxiosHelper.BASE_URL,
      timeout: 8_000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://101.qq.com/',
        'User-Agent': 'LeagueAkari'
      }
    })
    this.opggApi = new OpggHttpApiAxiosHelper(this._opggHttp)
    for (const http of [this._opggHttp, this._qq101Http]) {
      axiosRetry(http, {
        retries: 1,
        shouldResetTimeout: true,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) =>
          !isAbortError(error) && axiosRetry.isNetworkOrIdempotentRequestError(error)
      })
    }
  }

  register() {
    this._registerSource('opgg', CHAMPION_DATA_OPGG_FEATURE_GATE, this._opggHttp)
    this._registerSource('qq101', CHAMPION_DATA_QQ101_FEATURE_GATE, this._qq101Http)
  }

  unregister() {
    this._protocol.unregisterDomain('opgg')
    this._protocol.unregisterDomain('qq101')
  }

  private _registerSource(domain: string, gate: string, http: AxiosInstance) {
    this._protocol.registerDomain(domain, async (uri, request, context) => {
      if (!this._context.featureGating.getEvaluation(gate, false).enabled) {
        return new Response('Data source is disabled', { status: 403 })
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405 })
      }
      const headers = Object.fromEntries(request.headers.entries())
      delete headers[AKARI_PROXY_REQUEST_ID_HEADER]
      // Source-specific headers belong to the upstream client, not the renderer origin.
      delete headers.origin
      delete headers.referer
      delete headers.host
      let response: AxiosResponse
      try {
        response = await http.request({
          method: request.method,
          url: uri,
          allowAbsoluteUrls: false,
          headers,
          signal: context.signal,
          // These endpoints return JSON. Keep the protocol request registered until
          // the complete payload arrives so renderer cancellation reaches upstream.
          responseType: 'arraybuffer'
        })
      } catch (error) {
        // HTTP status errors stay HTTP status errors across akari://.
        if (!isAxiosError(error) || !error.response) {
          this._context.logger.warn(`Failed to proxy ${domain} request`, String(error))
          return new Response('Upstream request failed', { status: 502 })
        }
        response = error.response
      }
      return new Response(
        request.method === 'HEAD' || [204, 205, 304].includes(response.status)
          ? null
          : response.data,
        {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(
            Object.entries(response.headers).filter(([, value]) => typeof value === 'string')
          )
        }
      )
    })
  }
}
