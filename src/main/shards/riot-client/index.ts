import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import https from 'https'

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
import { RiotClientProtocolController } from './protocol-controller'

export { RiotClientRcuUninitializedError }

/**
 * Riot Client 相关封装
 */
@Shard(RiotClientMain.id)
export class RiotClientMain implements IAkariShardInitDispose {
  static id = RIOT_CLIENT_MAIN_NAMESPACE

  static REQUEST_TIMEOUT_MS = RIOT_CLIENT_REQUEST_TIMEOUT_MS

  private readonly _logger: AkariLogger
  private readonly _context: RiotClientMainContext
  private readonly _ipcHandlers: RiotClientIpcHandlers
  private readonly _protocolController: RiotClientProtocolController

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

    this._protocolController.register()
  }

  get api() {
    if (!this._riotClientApi) {
      throw new RiotClientRcuUninitializedError()
    }

    return this._riotClientApi
  }

  async requestForRenderer(config: AxiosRequestConfig) {
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

    return this._httpClient.request<T>(config)
  }

  async onInit() {
    this._ipcHandlers.register()

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
}
