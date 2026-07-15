import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import { AkariStaticHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/static'
import {
  type AkariApiBootstrapDocument,
  DEFAULT_AKARI_SERVICE_BASE_URLS,
  parseAkariApiBootstrapDocument
} from '@shared/shards/akari-api'
import axios from 'axios'
import { app } from 'electron'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AkariApiBootstrapController } from './bootstrap-controller'
import {
  AKARI_API_MAIN_NAMESPACE,
  AKARI_API_REQUEST_TIMEOUT,
  type AkariApiMainContext
} from './context'
import { AkariApiIpcHandlers } from './ipc-handlers'
import { AkariApiState } from './state'

@Shard(AkariApiMain.id)
export class AkariApiMain implements IAkariShardInitDispose {
  static readonly id = AKARI_API_MAIN_NAMESPACE

  public readonly state = new AkariApiState()
  public readonly api: AkariApiHttpApiAxiosHelper
  public readonly staticAssets: AkariStaticHttpApiAxiosHelper

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AkariApiMainContext
  private readonly _bootstrapController: AkariApiBootstrapController
  private readonly _ipcHandlers: AkariApiIpcHandlers
  private readonly _apiHttp = axios.create({
    baseURL: DEFAULT_AKARI_SERVICE_BASE_URLS.api,
    timeout: AKARI_API_REQUEST_TIMEOUT,
    headers: {
      Accept: 'application/json',
      'User-Agent': `LeagueAkari/${app.getVersion()}`,
      'x-akari-version': app.getVersion()
    }
  })
  private readonly _staticHttp = axios.create({
    baseURL: DEFAULT_AKARI_SERVICE_BASE_URLS.static,
    timeout: AKARI_API_REQUEST_TIMEOUT,
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()}`,
      'x-akari-version': app.getVersion()
    }
  })
  private readonly _npmHttp = axios.create({
    timeout: AKARI_API_REQUEST_TIMEOUT,
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()}`
    }
  })

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._logger = _loggerFactory.create(AkariApiMain.id)
    this._settingService = _settingFactory.register(AkariApiMain.id)
    this.api = new AkariApiHttpApiAxiosHelper(this._apiHttp)
    this.staticAssets = new AkariStaticHttpApiAxiosHelper(this._staticHttp)
    this._context = {
      namespace: AkariApiMain.id,
      state: this.state,
      ipc: this._ipc,
      logger: this._logger,
      settingService: this._settingService,
      api: this.api
    }
    this._bootstrapController = new AkariApiBootstrapController(
      this._context,
      this._npmHttp,
      this.applyBootstrap.bind(this)
    )
    this._ipcHandlers = new AkariApiIpcHandlers(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(AkariApiMain.id, 'state', this.state, ['baseUrls'])

    try {
      await this._bootstrapController.initFromLocal()
    } catch (error) {
      this._logger.warn('Failed to load Akari API bootstrap from local cache', error)
    }

    this._ipcHandlers.register()
    void this._bootstrapController.updateFromNpm()
  }

  applyBootstrap(value: unknown): AkariApiBootstrapDocument {
    const bootstrap = parseAkariApiBootstrapDocument(value)

    this._applyBaseUrls(bootstrap.baseUrls)
    this.state.setBaseUrls(bootstrap.baseUrls)

    return bootstrap
  }

  resetToDefaultBaseUrls() {
    this._applyBaseUrls(DEFAULT_AKARI_SERVICE_BASE_URLS)
    this.state.setBaseUrls(DEFAULT_AKARI_SERVICE_BASE_URLS)
    this._logger.info('Reset Akari API service discovery to built-in defaults')
  }

  resolveStaticUrl(path: string) {
    return this.staticAssets.resolveUrl(path)
  }

  private _applyBaseUrls(baseUrls: AkariApiBootstrapDocument['baseUrls']) {
    this._apiHttp.defaults.baseURL = baseUrls.api
    this._staticHttp.defaults.baseURL = baseUrls.static
  }
}
