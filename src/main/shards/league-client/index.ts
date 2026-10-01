import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import { AxiosRequestConfig } from 'axios'
import { z } from 'zod'

import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { LeagueClientUxMain } from '../league-client-ux'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { LeagueClientOperationsExecutor } from './client-operations-executor'
import { LeagueClientConnectionController } from './connection-controller'
import {
  LEAGUE_CLIENT_CONNECT_RETRY_INTERVAL,
  LEAGUE_CLIENT_HTTP_PING_URL,
  LEAGUE_CLIENT_ITEM_SET_PREFIX,
  LEAGUE_CLIENT_MAIN_NAMESPACE,
  LEAGUE_CLIENT_PROCESS_NAME,
  LEAGUE_CLIENT_REQUEST_TIMEOUT_MS,
  LeagueClientLcuUninitializedError,
  type LeagueClientMainContext
} from './context'
import { LeagueClientIpcHandlers } from './ipc-handlers'
import { LeagueClientData } from './lc-state'
import { LeagueClientProtocolController } from './protocol-controller'
import { LeagueClientSettings, LeagueClientState } from './state'

export { LeagueClientLcuUninitializedError }
export type { LeagueClientMainContext }

@Shard(LeagueClientMain.id)
export class LeagueClientMain implements IAkariShardInitDispose {
  static id = LEAGUE_CLIENT_MAIN_NAMESPACE
  static CONNECT_TO_LC_RETRY_INTERVAL = LEAGUE_CLIENT_CONNECT_RETRY_INTERVAL
  static HTTP_PING_URL = LEAGUE_CLIENT_HTTP_PING_URL
  static REQUEST_TIMEOUT_MS = LEAGUE_CLIENT_REQUEST_TIMEOUT_MS
  static FIXED_ITEM_SET_PREFIX = LEAGUE_CLIENT_ITEM_SET_PREFIX
  static PROCESS_NAME = LEAGUE_CLIENT_PROCESS_NAME

  public readonly settings = new LeagueClientSettings()
  public readonly state = new LeagueClientState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: LeagueClientMainContext
  private readonly _ipcHandlers: LeagueClientIpcHandlers
  private _leagueClientData: LeagueClientData
  private readonly _connectionController: LeagueClientConnectionController
  private readonly _protocolController: LeagueClientProtocolController
  private readonly _operationsExecutor: LeagueClientOperationsExecutor

  get http() {
    return this._connectionController.http
  }

  get api() {
    return this._connectionController.api
  }

  get data() {
    return this._leagueClientData
  }

  get events() {
    return this._connectionController.events
  }

  constructor(
    private readonly _ipc: AkariIpcMain,
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _leagueClientUx: LeagueClientUxMain,
    private readonly _protocol: AkariProtocolMain
  ) {
    this._logger = _loggerFactory.create(LeagueClientMain.id)
    this._settingService = _settingFactory.register(
      LeagueClientMain.id,
      {
        autoConnect: { default: this.settings.autoConnect, schema: z.boolean() }
      },
      this.settings
    )

    this._context = {
      state: this.state,
      settings: this.settings,
      settingService: this._settingService,
      leagueClientUx: this._leagueClientUx,
      protocol: this._protocol,
      ipc: this._ipc,
      leagueClient: this,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      namespace: LeagueClientMain.id
    }
    this._connectionController = new LeagueClientConnectionController(this._context)
    this._protocolController = new LeagueClientProtocolController(this._context)
    this._operationsExecutor = new LeagueClientOperationsExecutor(this._context)
    this._ipcHandlers = new LeagueClientIpcHandlers(this._context)
    this._leagueClientData = new LeagueClientData(this._context)

    this._protocolController.register()
  }

  async onInit() {
    this._leagueClientData.init()
    this._setupState()
    this._ipcHandlers.register()
    this._connectionController.start()
  }

  async onDispose() {
    this._connectionController.dispose()
    this._protocolController.dispose()
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(LeagueClientMain.id, 'state', this.state, [
      'auth',
      'connectionState',
      'connectingClient'
    ])
    this._mobxUtils.propSync(LeagueClientMain.id, 'settings', this.settings, ['autoConnect'])
  }

  async requestForRenderer(config: AxiosRequestConfig) {
    return this._connectionController.requestForRenderer(config)
  }

  async connect(auth: UxCommandLine & { force?: boolean }) {
    return this._connectionController.connect(auth)
  }

  disconnect() {
    return this._connectionController.disconnect()
  }

  subscribeLcuEndpoint(uri: string) {
    return this._connectionController.subscribeLcuEndpoint(uri)
  }

  unsubscribeLcuEndpoint(subId: string) {
    return this._connectionController.unsubscribeLcuEndpoint(subId)
  }

  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    return this._connectionController.request<T, D>(config)
  }

  async writeItemSetsToDisk(itemSets: any[] | null, clearPrevious = true) {
    return this._operationsExecutor.writeItemSetsToDisk(itemSets, clearPrevious)
  }

  async peekClient(auth: UxCommandLine) {
    return this._operationsExecutor.peekClient(auth)
  }

  async fixWindowMethodA(config?: { baseHeight: number; baseWidth: number }) {
    return this._operationsExecutor.fixWindowMethodA(config)
  }
}
