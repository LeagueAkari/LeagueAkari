import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import {
  AKARI_HEADER_FORCE_STREAM_COLLECT,
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from '@shared/http-api-axios-helper/sgp/patterns'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosRequestConfig, isAxiosError } from 'axios'
import { AxiosRetry } from 'axios-retry'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SgpState } from './state'

const axiosRetry = require('axios-retry').default as AxiosRetry

/**
 * Service Gateway Proxy (for **League** of Legends)
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
@Shard(SgpMain.id)
export class SgpMain implements IAkariShardInitDispose {
  static id = 'sgp-main'

  public readonly state: SgpState

  private readonly _logger: AkariLogger
  private readonly _sgpApi: SgpHttpApiAxiosHelper
  private readonly _httpClient = axios.create()

  get api() {
    return this._sgpApi
  }

  constructor(
    private readonly _appCommon: AppCommonMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _protocol: AkariProtocolMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this._logger = _loggerFactory.create(SgpMain.id)
    axiosRetry(this._httpClient, { retries: 2 })

    this.state = new SgpState(this._leagueClient.state, this._remoteConfig)
    this._sgpApi = new SgpHttpApiAxiosHelper(this._httpClient)
  }

  async onInit() {
    this._mobxUtils.propSync(SgpMain.id, 'state', this.state, [
      'availability',
      'isTokenReady',
      'leagueServers',
      'supportedQueues',
      'connectionSuccessesCounted',
      'connectionFailuresCounted'
    ])

    this._registerHttpProxy()
    this._maintainEntitlementsToken()
    this._maintainLeagueSessionToken()
    this._initHttpInstance()
    this._registerProtocol()
    this._watchConnectionCountReset()
  }

  private _maintainEntitlementsToken() {
    this._mobxUtils.reaction(
      () => this._leagueClient.data.entitlements.token,
      (token) => {
        if (!token) {
          this.state.setEntitlementsTokenSet(false)
          return
        }

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        this._logger.info(`Update Entitlements Token: ${JSON.stringify(copiedToken)}`)

        this.state.setEntitlementsTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLeagueSessionToken() {
    this._mobxUtils.reaction(
      () => this._leagueClient.data.leagueSession.token,
      (token) => {
        if (!token) {
          this.state.setLeagueSessionTokenSet(false)
          return
        }

        const copied = token.slice(0, 24) + '...'
        this._logger.info(`Update Lol League Session Token: ${copied}`)
        this.state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _registerHttpProxy() {
    this._mobxUtils.reaction(
      () => this._appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._httpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._httpClient.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  private _initHttpInstance() {
    this._httpClient.interceptors.request.use(async (config) => {
      const preferredSgpServerId =
        (config.headers.get(AKARI_HEADER_SGP_SERVER_ID) as string | null) ||
        this.state.availability.sgpServerId

      const requiredTokenType = config.headers.get(AKARI_HEADER_TOKEN_TYPE) as string | null

      if (requiredTokenType) {
        const token = this._getToken(requiredTokenType)
        if (!token) {
          throw new Error(`Token not found for type: ${requiredTokenType}`)
        }
        config.headers.setAuthorization(`Bearer ${token}`)
      }

      const serverConfig = this.state.leagueServers.servers[preferredSgpServerId]
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

    // check network connectivity
    this._httpClient.interceptors.response.use(
      (response) => {
        this.state.setConnectionSuccessesCount(this.state.connectionSuccessesCounted + 1)
        return response
      },
      (error) => {
        if (isAxiosError(error) && error.response === undefined) {
          this.state.setConnectionFailuresCount(this.state.connectionFailuresCounted + 1)
        }

        return Promise.reject(error)
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
    if (tokenType === 'entitlements') {
      return this._leagueClient.data.entitlements.token?.accessToken ?? null
    } else if (tokenType === 'league-session') {
      return this._leagueClient.data.leagueSession.token ?? null
    }
    return null
  }

  private _registerProtocol() {
    this._protocol.registerDomain('sgp', async (uri, req) => {
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

        const res = await this._httpClient.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        this._logger.warn(`Failed to proxy SGP request`, error)

        return new Response(formatError(error), {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }

  private _watchConnectionCountReset() {
    this._mobxUtils.reaction(
      () => this.state.availability.sgpServerId,
      (id) => {
        if (!id) {
          this.state.setConnectionSuccessesCount(0)
          this.state.setConnectionFailuresCount(0)
        }
      }
    )
  }
}

function isNodeReadableStream(value: any): value is Readable {
  return (
    !!value &&
    (value instanceof Readable || (typeof value === 'object' && typeof value.pipe === 'function'))
  )
}

async function readNodeStreamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    if (!chunk) continue
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
