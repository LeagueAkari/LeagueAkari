import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import {
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from '@shared/http-api-axios-helper/sgp/patterns'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosRequestConfig } from 'axios'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SgpState } from './state'

/**
 * Service Gateway Proxy (for **League** of Legends)
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
@Shard(SgpMain.id)
export class SgpMain implements IAkariShardInitDispose {
  static id = 'sgp-main'

  public readonly state: SgpState

  private readonly _log: AkariLogger

  private readonly _api: SgpHttpApiAxiosHelper

  private readonly _http = axios.create()

  get api() {
    return this._api
  }

  constructor(
    private readonly _app: AppCommonMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _protocol: AkariProtocolMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _lc: LeagueClientMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this._log = _loggerFactory.create(SgpMain.id)

    this.state = new SgpState(this._lc.state, this._remoteConfig)
    this._api = new SgpHttpApiAxiosHelper(this._http)
  }

  async onInit() {
    this._mobx.propSync(SgpMain.id, 'state', this.state, [
      'availability',
      'isTokenReady',
      'leagueServers',
      'supportedQueues'
    ])

    this._handleUpdateHttpProxy()
    this._maintainEntitlementsToken()
    this._maintainLeagueSessionToken()
    this._initHttpInstance()
    this._handleProtocol()
  }

  private _maintainEntitlementsToken() {
    this._mobx.reaction(
      () => this._lc.data.entitlements.token,
      (token) => {
        if (!token) {
          this.state.setEntitlementsTokenSet(false)
          return
        }

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        this._log.info(`Update Entitlements Token: ${JSON.stringify(copiedToken)}`)

        this.state.setEntitlementsTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLeagueSessionToken() {
    this._mobx.reaction(
      () => this._lc.data.leagueSession.token,
      (token) => {
        if (!token) {
          this.state.setLeagueSessionTokenSet(false)
          return
        }

        const copied = token.slice(0, 24) + '...'

        this._log.info(`Update Lol League Session Token: ${copied}`)

        this.state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  private _initHttpInstance() {
    this._http.interceptors.request.use((config) => {
      const preferredSgpServerId =
        (config.headers.get(AKARI_HEADER_SGP_SERVER_ID) as string | null) ||
        this.state.availability.sgpServerId

      if (config.url) {
        config.url = config.url.replace(
          URL_PLACEHOLDER_SUB_ID,
          this._getSubId(preferredSgpServerId)
        )
      }

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

      const baseUrl =
        requiredTokenType === 'entitlements' ? serverConfig.matchHistory : serverConfig.common

      if (!baseUrl) {
        throw new Error(
          `Base URL not found for sgp server ID: ${preferredSgpServerId}, requiredTokenType: ${requiredTokenType}`
        )
      }

      config.baseURL = baseUrl
      config.headers.delete(AKARI_HEADER_SGP_SERVER_ID)
      config.headers.delete(AKARI_HEADER_TOKEN_TYPE)

      return config
    })
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
      return this._lc.data.entitlements.token?.accessToken ?? null
    } else if (tokenType === 'league-session') {
      return this._lc.data.leagueSession.token ?? null
    }
    return null
  }

  private _handleProtocol() {
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

        const res = await this._http.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        this._log.warn(`Failed to proxy SGP request`, error)

        return new Response(formatError(error), {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }
}
