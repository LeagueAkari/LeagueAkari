import {
  AKARI_HEADER_FORCE_STREAM_COLLECT,
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from '@shared/http-api-axios-helper/sgp/patterns'
import { isAxiosError } from 'axios'

import type { SgpMainContext } from './context'
import { isNodeReadableStream, readNodeStreamToBuffer } from './stream-utils'

export class SgpHttpClientController {
  constructor(private readonly context: SgpMainContext) {}

  init() {
    this._registerHttpProxy()
    this._registerRequestInterceptor()
    this._registerResponseInterceptor()
    this._watchConnectionCountReset()
  }

  private _registerHttpProxy() {
    const { appCommon, httpClient, mobxUtils } = this.context

    mobxUtils.reaction(
      () => appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          httpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          httpClient.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  private _registerRequestInterceptor() {
    const { httpClient, state } = this.context

    httpClient.interceptors.request.use(async (config) => {
      const preferredSgpServerId =
        (config.headers.get(AKARI_HEADER_SGP_SERVER_ID) as string | null) ||
        state.availability.sgpServerId

      const requiredTokenType = config.headers.get(AKARI_HEADER_TOKEN_TYPE) as string | null

      if (requiredTokenType) {
        const token = this._getToken(requiredTokenType)
        if (!token) {
          throw new Error(`Token not found for type: ${requiredTokenType}`)
        }
        config.headers.setAuthorization(`Bearer ${token}`)
      }

      const serverConfig = state.leagueServers.servers[preferredSgpServerId]
      if (!serverConfig) {
        throw new Error(`Server config not found for sgp server ID: ${preferredSgpServerId}`)
      }

      if (config.url) {
        config.url = config.url.replace(
          URL_PLACEHOLDER_SUB_ID,
          serverConfig.regionPathParam ?? this._getSubId(preferredSgpServerId)
        )
      }

      const baseUrl =
        requiredTokenType === 'entitlements' ? serverConfig.matchHistory : serverConfig.common

      if (!baseUrl) {
        throw new Error(
          `Base URL not found for sgp server ID: ${preferredSgpServerId}, requiredTokenType: ${requiredTokenType}`
        )
      }

      config.baseURL = baseUrl

      const forceContentLength = config.headers.get(AKARI_HEADER_FORCE_STREAM_COLLECT) !== null

      if (forceContentLength && isNodeReadableStream(config.data)) {
        config.data = await readNodeStreamToBuffer(config.data)
        config.maxBodyLength = Infinity
        config.maxContentLength = Infinity
        config.headers.delete('Transfer-Encoding')
      }

      config.headers.delete(AKARI_HEADER_SGP_SERVER_ID)
      config.headers.delete(AKARI_HEADER_TOKEN_TYPE)
      config.headers.delete(AKARI_HEADER_FORCE_STREAM_COLLECT)

      return config
    })
  }

  private _registerResponseInterceptor() {
    const { httpClient, state } = this.context

    // check network connectivity
    httpClient.interceptors.response.use(
      (response) => {
        state.setConnectionSuccessesCount(state.connectionSuccessesCounted + 1)
        return response
      },
      (error) => {
        if (isAxiosError(error) && error.response === undefined) {
          state.setConnectionFailuresCount(state.connectionFailuresCounted + 1)
        }

        return Promise.reject(error)
      }
    )
  }

  private _watchConnectionCountReset() {
    const { mobxUtils, state } = this.context

    mobxUtils.reaction(
      () => state.availability.sgpServerId,
      (id) => {
        if (!id) {
          state.setConnectionSuccessesCount(0)
          state.setConnectionFailuresCount(0)
        }
      }
    )
  }

  private _getSubId(sgpServerId: string) {
    if (sgpServerId.startsWith('TENCENT')) {
      const [_, rsoPlatformId] = sgpServerId.split('_')
      return rsoPlatformId
    }
    return sgpServerId
  }

  private _getToken(tokenType: string) {
    const { leagueClient } = this.context

    if (tokenType === 'entitlements') {
      return leagueClient.data.entitlements.token?.accessToken ?? null
    } else if (tokenType === 'league-session') {
      return leagueClient.data.leagueSession.token ?? null
    }
    return null
  }
}
