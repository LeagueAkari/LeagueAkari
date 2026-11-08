import { createChampionDataHttpClient } from '@main/utils/champion-data-http'
import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import { type AxiosInstance, type AxiosResponse, isAxiosError } from 'axios'

import type { AkariProtocolMain } from '../akari-protocol'
import type { NetworkMain } from '../network'
import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE,
  type ChampionDataMainContext
} from './context'

export class ChampionDataProtocolController {
  private readonly _opggHttp: AxiosInstance
  private readonly _qq101Http: AxiosInstance

  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _protocol: AkariProtocolMain,
    network: NetworkMain
  ) {
    this._opggHttp = createChampionDataHttpClient(network, {
      baseURL: OpggHttpApiAxiosHelper.BASE_URL
    })
    this._qq101Http = createChampionDataHttpClient(network, {
      baseURL: Qq101HttpApiAxiosHelper.BASE_URL,
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://101.qq.com/',
        'User-Agent': 'LeagueAkari'
      }
    })
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
          responseType: 'stream'
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
