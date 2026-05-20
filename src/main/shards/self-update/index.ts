import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import axios from 'axios'
import { app } from 'electron'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  DOWNLOAD_DIR_NAME as SELF_UPDATE_DOWNLOAD_DIR_NAME,
  SELF_UPDATE_MAIN_NAMESPACE,
  NEW_VERSION_FLAG as SELF_UPDATE_NEW_VERSION_FLAG,
  UPDATE_PROGRESS_UPDATE_INTERVAL as SELF_UPDATE_PROGRESS_UPDATE_INTERVAL,
  EXECUTABLE_NAME as SELF_UPDATE_TARGET_EXECUTABLE_NAME,
  UPDATE_EXECUTABLE_NAME as SELF_UPDATE_UPDATER_EXECUTABLE_NAME,
  type SelfUpdateMainContext
} from './context'
import { SelfUpdateIpcHandlers } from './ipc-handlers'
import { LastUpdateChecker } from './last-update-checker'
import { shouldRunSelfUpdateLifecycle } from './platform'
import { SelfUpdateSettings, SelfUpdateState } from './state'
import { SelfUpdateUninstaller } from './uninstaller'
import { SelfUpdateExecutor } from './update-executor'
import { SelfUpdateWatcher } from './update-watcher'

/**
 * 负责更新包的下载与解压工作
 */
@Shard(SelfUpdateMain.id)
export class SelfUpdateMain implements IAkariShardInitDispose {
  static id = SELF_UPDATE_MAIN_NAMESPACE

  static DOWNLOAD_DIR_NAME = SELF_UPDATE_DOWNLOAD_DIR_NAME
  static UPDATE_EXECUTABLE_NAME = SELF_UPDATE_UPDATER_EXECUTABLE_NAME
  static NEW_VERSION_FLAG = SELF_UPDATE_NEW_VERSION_FLAG
  static EXECUTABLE_NAME = SELF_UPDATE_TARGET_EXECUTABLE_NAME
  static UPDATE_PROGRESS_UPDATE_INTERVAL = SELF_UPDATE_PROGRESS_UPDATE_INTERVAL

  public readonly settings = new SelfUpdateSettings()
  public readonly state = new SelfUpdateState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: SelfUpdateMainContext
  private readonly _executor: SelfUpdateExecutor
  private readonly _uninstaller: SelfUpdateUninstaller
  private readonly _ipcHandlers: SelfUpdateIpcHandlers
  private readonly _lastUpdateChecker: LastUpdateChecker
  private readonly _watcher: SelfUpdateWatcher

  private readonly _httpClient = axios.create({
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()} `
    }
  })

  constructor(
    private readonly _appCommon: AppCommonMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _remoteConfig: RemoteConfigMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._logger = _loggerFactory.create(SelfUpdateMain.id)
    this._settingService = _settingFactory.register(
      SelfUpdateMain.id,
      {
        autoDownloadUpdates: { default: this.settings.autoDownloadUpdates },
        ignoreVersion: { default: this.settings.ignoreVersion }
      },
      this.settings
    )

    this._context = {
      namespace: SelfUpdateMain.id,
      settings: this.settings,
      state: this.state,
      logger: this._logger,
      appCommon: this._appCommon,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      remoteConfig: this._remoteConfig,
      httpClient: this._httpClient
    }

    this._executor = new SelfUpdateExecutor(this._context)
    this._uninstaller = new SelfUpdateUninstaller(this._context)
    this._ipcHandlers = new SelfUpdateIpcHandlers(this._context, this._executor, this._uninstaller)
    this._lastUpdateChecker = new LastUpdateChecker(this._context)
    this._watcher = new SelfUpdateWatcher(this._context, this._executor)
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(SelfUpdateMain.id, 'state', this.state, [
      'updateProgressInfo',
      'lastUpdateResult'
    ])

    this._mobxUtils.propSync(SelfUpdateMain.id, 'settings', this.settings, [
      'autoDownloadUpdates',
      'ignoreVersion'
    ])
  }

  async onInit() {
    await this._setupState()
    this._ipcHandlers.register()

    if (!shouldRunSelfUpdateLifecycle()) {
      this._logger.info('Self-update is Windows-only; disabled on', process.platform)
      return
    }

    await this._lastUpdateChecker.check()
    this._watcher.registerHttpProxy()
    this._watcher.watchUpdateProcess()
  }

  async onDispose() {
    await this._executor.runUpdateOnQuit()
    this._executor.cancelIfNotWaitingForRestart()
  }
}
