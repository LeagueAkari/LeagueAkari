import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import axios from 'axios'
import { AxiosRetry } from 'axios-retry'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SGP_MAIN_NAMESPACE, type SgpMainContext } from './context'
import { SgpHttpClientController } from './http-client-controller'
import { SgpProtocolController } from './protocol-controller'
import { SgpState } from './state'
import { SgpTokenStateController } from './token-state-controller'

const axiosRetry = require('axios-retry').default as AxiosRetry

/**
 * Service Gateway Proxy (for **League** of Legends)
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
@Shard(SgpMain.id)
export class SgpMain implements IAkariShardInitDispose {
  static id = SGP_MAIN_NAMESPACE

  public readonly state: SgpState

  private readonly _logger: AkariLogger
  private readonly _sgpApi: SgpHttpApiAxiosHelper
  private readonly _httpClient = axios.create()
  private readonly _context: SgpMainContext
  private readonly _httpClientController: SgpHttpClientController
  private readonly _protocolController: SgpProtocolController
  private readonly _tokenStateWatcher: SgpTokenStateController

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
    this._context = {
      namespace: SgpMain.id,
      appCommon: this._appCommon,
      httpClient: this._httpClient,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      protocol: this._protocol,
      remoteConfig: this._remoteConfig,
      state: this.state
    }
    this._httpClientController = new SgpHttpClientController(this._context)
    this._protocolController = new SgpProtocolController(this._context)
    this._tokenStateWatcher = new SgpTokenStateController(this._context)
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

    this._tokenStateWatcher.watch()
    this._httpClientController.init()
    this._protocolController.register()
  }
}
