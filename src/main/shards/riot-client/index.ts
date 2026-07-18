import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import https from 'https'

import { assertLocalClientRequestUrl } from '../../utils/local-client-url'
import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import {
  RIOT_CLIENT_MAIN_NAMESPACE,
  RIOT_CLIENT_REQUEST_TIMEOUT_MS,
  type RiotClientMainContext,
  RiotClientRcuUninitializedError
} from './context'
import { RiotClientIpcHandlers } from './ipc-handlers'
import {
  type RiotClientProcessAuth,
  RiotClientProcessAuthReader,
  shouldReadRiotClientProcessAuth
} from './process-auth'
import { RiotClientProcessAuthController } from './process-auth-controller'
import { RiotClientProtocolController } from './protocol-controller'

export { RiotClientRcuUninitializedError }

/**
 * Riot Client 相关封装
 */
@Shard(RiotClientMain.id)
export class RiotClientMain implements IAkariShardInitDispose {
  static id = RIOT_CLIENT_MAIN_NAMESPACE

  static REQUEST_TIMEOUT_MS = RIOT_CLIENT_REQUEST_TIMEOUT_MS
  static PROCESS_AUTH_POLL_INTERVAL = 5000

  private readonly _logger: AkariLogger
  private readonly _context: RiotClientMainContext
  private readonly _ipcHandlers: RiotClientIpcHandlers
  private readonly _protocolController: RiotClientProtocolController
  private readonly _processAuthController: RiotClientProcessAuthController | null

  private _riotClientApi: RiotClientHttpApiAxiosHelper | null = null

  private _httpClient: AxiosInstance | null = null

  // Riot Client 的事件推送格式和 League Client 完全相同, 但由于当前应用暂未使用, 所以不实现
  // private _webSocket: WebSocket | null = null
  // private _eventBus = new RadixEventEmitter()

  constructor(
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _protocol: AkariProtocolMain
  ) {
    this._logger = _loggerFactory.create(RiotClientMain.id)
    this._context = {
      namespace: RiotClientMain.id,
      ipc: this._ipc,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      protocol: this._protocol,
      riotClient: this
    }
    this._ipcHandlers = new RiotClientIpcHandlers(this._context)
    this._protocolController = new RiotClientProtocolController(this._context)
    this._processAuthController = shouldReadRiotClientProcessAuth()
      ? new RiotClientProcessAuthController(
          new RiotClientProcessAuthReader(),
          (auth) => {
            if (auth) {
              this._initHttpInstance(auth)
            } else {
              this._clearHttpInstance()
            }
          },
          this._logger,
          RiotClientMain.PROCESS_AUTH_POLL_INTERVAL
        )
      : null

    this._protocolController.register()
  }

  get api() {
    if (!this._riotClientApi) {
      throw new RiotClientRcuUninitializedError()
    }

    return this._riotClientApi
  }

  async requestForRenderer(config: AxiosRequestConfig) {
    assertLocalClientRequestUrl(config.url)

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
  }

  /**
   * RC 的请求, 🐰
   */
  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._httpClient) {
      throw new Error('RC Uninitialized')
    }

    assertLocalClientRequestUrl(config.url)
    return this._httpClient.request<T>(config)
  }

  async onInit() {
    this._ipcHandlers.register()

    if (this._processAuthController) {
      await this._processAuthController.start()
    } else {
      this._mobxUtils.reaction(
        () => this._leagueClient.state.auth,
        async (auth) => {
          if (auth?.riotClientPort && auth.riotClientAuthToken) {
            this._initHttpInstance({
              authToken: auth.riotClientAuthToken,
              pid: auth.pid,
              port: auth.riotClientPort
            })
          } else {
            this._clearHttpInstance()
          }
        },
        { fireImmediately: true }
      )
    }
  }

  async onDispose() {
    this._processAuthController?.stop()
    this._clearHttpInstance()
    this._protocol.unregisterDomain('riot-client')
  }

  private _clearHttpInstance() {
    this._httpClient = null
    this._riotClientApi = null
  }

  private _initHttpInstance(auth: RiotClientProcessAuth) {
    this._httpClient = axios.create({
      baseURL: `https://127.0.0.1:${auth.port}`,
      allowAbsoluteUrls: false,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
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
}
