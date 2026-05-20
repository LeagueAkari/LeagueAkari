import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import { LatestReleaseInfo } from '@shared/types/akari'
import axios from 'axios'
import { app } from 'electron'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { RemoteConfigAnnouncementController } from './announcement-controller'
import { RemoteConfigCachedSync } from './cached-sync'
import {
  REMOTE_CONFIG_AUTO_SELECT_GROUPS_RELATIVE_PATH,
  REMOTE_CONFIG_LEAGUE_SERVERS_RELATIVE_PATH,
  REMOTE_CONFIG_MAIN_NAMESPACE,
  REMOTE_CONFIG_ONGOING_GAME_CONFIG_RELATIVE_PATH,
  REMOTE_CONFIG_SUPPORTED_QUEUES_RELATIVE_PATH,
  type RemoteConfigMainContext
} from './context'
import { RemoteConfigDiagnostics } from './diagnostics'
import { RemoteConfigIpcHandlers } from './ipc-handlers'
import { RemoteConfigReleaseController } from './release-controller'
import { RemoteGitRepository } from './repository'
import { RemoteConfigSettings, RemoteConfigState } from './state'

/**
 * 从 GitHub / Gitee 获取数据, 并提供给其他模块使用
 *
 * TODO NEED MIGRATION
 */
@Shard(RemoteConfigMain.id)
export class RemoteConfigMain implements IAkariShardInitDispose {
  static readonly id = REMOTE_CONFIG_MAIN_NAMESPACE

  static SUPPORTED_QUEUES_RELATIVE_PATH = REMOTE_CONFIG_SUPPORTED_QUEUES_RELATIVE_PATH
  static LEAGUE_SERVERS_RELATIVE_PATH = REMOTE_CONFIG_LEAGUE_SERVERS_RELATIVE_PATH
  static ONGOING_GAME_CONFIG_RELATIVE_PATH = REMOTE_CONFIG_ONGOING_GAME_CONFIG_RELATIVE_PATH
  static AUTO_SELECT_GROUPS_RELATIVE_PATH = REMOTE_CONFIG_AUTO_SELECT_GROUPS_RELATIVE_PATH

  public readonly state = new RemoteConfigState()
  public readonly settings = new RemoteConfigSettings()

  private readonly _repository = new RemoteGitRepository()
  private readonly _akariApi = new AkariApiHttpApiAxiosHelper(
    axios.create({
      headers: {
        'User-Agent': `LeagueAkari/${app.getVersion()} `
      }
    })
  )

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: RemoteConfigMainContext

  private readonly _cachedResources: RemoteConfigCachedSync
  private readonly _announcement: RemoteConfigAnnouncementController
  private readonly _release: RemoteConfigReleaseController
  private readonly _diagnostics: RemoteConfigDiagnostics
  private readonly _ipcHandlers: RemoteConfigIpcHandlers

  get repo() {
    return this._repository
  }

  constructor(
    loggerFactory: LoggerFactoryMain,
    settingFactory: SettingFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _appCommon: AppCommonMain
  ) {
    this._logger = loggerFactory.create(RemoteConfigMain.id)
    this._settingService = settingFactory.register(
      RemoteConfigMain.id,
      {
        // China mainland use gitee for better performance
        // due to Great Food Wallet
        preferredSource: {
          default: Intl.DateTimeFormat()
            .resolvedOptions()
            .locale.toLocaleLowerCase()
            .includes('zh-cn')
            ? 'gitee'
            : 'github'
        }
      },
      this.settings
    )

    this._context = {
      namespace: RemoteConfigMain.id,
      state: this.state,
      settings: this.settings,
      logger: this._logger,
      settingService: this._settingService,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc,
      appCommon: this._appCommon,
      repository: this._repository,
      akariApi: this._akariApi
    }

    this._cachedResources = new RemoteConfigCachedSync(this._context)
    this._announcement = new RemoteConfigAnnouncementController(this._context)
    this._release = new RemoteConfigReleaseController(this._context)
    this._diagnostics = new RemoteConfigDiagnostics(this._context)
    this._ipcHandlers = new RemoteConfigIpcHandlers(this._context, this._diagnostics)
  }

  async onInit() {
    await this._setupState()

    try {
      await this._cachedResources.initFromLocal()
    } catch (error) {
      this._logger.warn('Failed to init config files from local', error)
    }

    this._ipcHandlers.register()
    this._cachedResources.watch()
    this._announcement.watch()
    this._release.watch()
  }

  async updateLatestReleaseManually() {
    return this._release.updateLatestReleaseManually()
  }

  async getLatestReleaseFromLastResort(): Promise<LatestReleaseInfo> {
    return this._release.getLatestReleaseFromLastResort()
  }

  async testRepoLatency() {
    return this._diagnostics.testRepoLatency()
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(RemoteConfigMain.id, 'state', this.state, [
      'announcement',
      'latestRelease',
      'leagueServers',
      'supportedQueues',
      'ongoingGameConfig',
      'isUpdatingLatestRelease',
      'isUpdatingAnnouncement',
      'isUpdatingLeagueServers',
      'isUpdatingSupportedQueues',
      'isUpdatingOngoingGameConfig'
    ])

    this._mobxUtils.propSync(RemoteConfigMain.id, 'settings', this.settings, [
      'preferredSource',
      'updateLatestRelease'
    ])
  }
}
