import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import { UxCommandLine } from '@shared/types/shards/league-client-ux'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import https from 'https'

import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'

export class RiotClientRcuUninitializedError extends Error {
  name = 'RiotClientRcuUninitializedError'
}

/**
 * Riot Client 相关封装
 */
@Shard(RiotClientMain.id)
export class RiotClientMain implements IAkariShardInitDispose {
  static id = 'riot-client-main'

  static REQUEST_TIMEOUT_MS = 17500

  private readonly _logger: AkariLogger

  private _riotClientApi: RiotClientHttpApiAxiosHelper | null = null

  private _httpClient: AxiosInstance | null = null

  // Riot Client 的事件推送格式和 League Client 完全相同, 但由于当前应用暂未使用, 所以不实现
  // private _webSocket: WebSocket | null = null
  // private _eventBus = new RadixEventEmitter()

  constructor(
    private readonly _ipc: AkariIpcMain,
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _protocol: AkariProtocolMain
  ) {
    this._logger = _loggerFactory.create(RiotClientMain.id)

    this._registerProtocol()
  }

  get api() {
    if (!this._riotClientApi) {
      throw new RiotClientRcuUninitializedError()
    }

    return this._riotClientApi
  }

  private _registerProtocol() {
    this._protocol.registerDomain('riot-client', async (uri, req) => {
      const reqHeaders: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })

      try {
        const config: AxiosRequestConfig = {
          method: req.method,
          url: uri,
          data: req.body ? AkariProtocolMain.convertWebStreamToNodeStream(req.body) : undefined,
          validateStatus: () => true,
          responseType: 'stream',
          headers: reqHeaders
        }

        const res = await this.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        this._logger.warn(`Failed to RiotClient request`, error)

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

  private _registerIpcHandlers() {
    this._ipc.onCall(RiotClientMain.id, 'http-request', async (_, config) => {
      try {
        const { config: c, request, ...rest } = await this._httpClient!.request(config)

        return {
          ...rest,
          config: { data: c.data, url: c.url }
        }
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          const { config: c, request, ...rest } = error.response
          return {
            ...rest,
            config: { data: c.data, url: c.url }
          }
        }

        this._logger.warn(`RiotClient HTTP client error`, error)

        throw error
      }
    })
  }

  private _initHttpInstance(auth: UxCommandLine) {
    this._httpClient = axios.create({
      baseURL: `https://127.0.0.1:${auth.riotClientPort}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.riotClientAuthToken}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
      }),
      httpAgent: new https.Agent({
        keepAlive: true
      }),
      timeout: RiotClientMain.REQUEST_TIMEOUT_MS,
      proxy: false
    })

    this._riotClientApi = new RiotClientHttpApiAxiosHelper(this._httpClient)
  }

  /**
   * RC 的请求, 🐰
   */
  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._httpClient) {
      throw new Error('RC Uninitialized')
    }

    return this._httpClient.request<T>(config)
  }

  async onInit() {
    this._registerIpcHandlers()

    this._mobxUtils.reaction(
      () => this._leagueClient.state.auth,
      async (auth) => {
        if (auth) {
          this._initHttpInstance(auth)
        } else {
          this._httpClient = null
          this._riotClientApi = null
        }
      },
      { fireImmediately: true }
    )
  }

  async onDispose() {
    this._httpClient = null
    this._riotClientApi = null
    this._protocol.unregisterDomain('riot-client')
  }
}
