import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AkariApiBootstrapController } from './bootstrap-controller'
import { AkariApiConfigLoader } from './config-loader'
import type { AkariApiMainContext } from './context'
import { AkariApiNoticeLoader } from './notice-loader'
import { AkariApiProtocolController } from './protocol-controller'
import { AkariApiReleaseLoader } from './release-loader'
import { AkariApiSettings, AkariApiState } from './state'

@Shard(AkariApiMain.id)
export class AkariApiMain implements IAkariShardInitDispose {
  static readonly id = 'akari-api-main'

  public readonly state = new AkariApiState()
  public readonly settings = new AkariApiSettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AkariApiMainContext
  private readonly _bootstrapController: AkariApiBootstrapController
  private readonly _protocolController: AkariApiProtocolController
  private readonly _configLoader: AkariApiConfigLoader
  private readonly _noticeLoader: AkariApiNoticeLoader
  private readonly _releaseLoader: AkariApiReleaseLoader

  get api() {
    return this._bootstrapController.api
  }

  get staticAssets() {
    return this._bootstrapController.staticAssets
  }

  constructor(
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    _protocol: AkariProtocolMain,
    _mobxUtils: MobxUtilsMain,
    _appCommon: AppCommonMain
  ) {
    this._logger = _loggerFactory.create(AkariApiMain.id)
    this._settingService = _settingFactory.register(
      AkariApiMain.id,
      {
        updateLatestRelease: { default: this.settings.updateLatestRelease }
      },
      this.settings
    )

    this._bootstrapController = new AkariApiBootstrapController(this._settingService, this._logger)
    this._protocolController = new AkariApiProtocolController(
      _protocol,
      this._logger,
      this._bootstrapController
    )
    this._context = {
      state: this.state,
      settings: this.settings,
      logger: this._logger,
      settingService: this._settingService,
      mobxUtils: _mobxUtils,
      appCommon: _appCommon,
      api: this.api
    }
    this._configLoader = new AkariApiConfigLoader(this._context)
    this._noticeLoader = new AkariApiNoticeLoader(this._context)
    this._releaseLoader = new AkariApiReleaseLoader(this._context)
  }

  async onInit() {
    await this._bootstrapController.init()
    await this._setupState()

    try {
      await this._configLoader.initFromLocal()
    } catch (error) {
      this._logger.warn('Failed to load config cache', error)
    }

    this._protocolController.register()
    this._configLoader.watch()
    this._noticeLoader.watch()
    this._releaseLoader.watch()
  }

  async onDispose() {
    this._configLoader.dispose()
    this._noticeLoader.dispose()
    this._releaseLoader.dispose()
    this._protocolController.unregister()
  }

  updateLatestReleaseManually() {
    return this._releaseLoader.updateLatestReleaseManually()
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._context.mobxUtils.propSync(AkariApiMain.id, 'state', this.state, [
      'notice',
      'latestRelease',
      'isUpdatingNotice',
      'isUpdatingLatestRelease'
    ])
    this._context.mobxUtils.propSync(AkariApiMain.id, 'settings', this.settings, [
      'updateLatestRelease'
    ])
  }
}
