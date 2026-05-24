import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ClientInstallationLauncher } from './client-launcher'
import {
  CLIENT_INSTALLATION_MAIN_NAMESPACE,
  LIVE_STREAMING_CLIENTS as CLIENT_LIVE_STREAMING_CLIENTS,
  LIVE_STREAMING_CLIENT_POLL_INTERVAL as CLIENT_LIVE_STREAMING_CLIENT_POLL_INTERVAL,
  TENCENT_INSTALL_DIRNAME as CLIENT_TENCENT_INSTALL_DIRNAME,
  TENCENT_LOL_DIRNAME as CLIENT_TENCENT_LOL_DIRNAME,
  TENCENT_REG_INSTALL_PATH as CLIENT_TENCENT_REG_INSTALL_PATH,
  TENCENT_REG_INSTALL_VALUE as CLIENT_TENCENT_REG_INSTALL_VALUE,
  WEGAME_DEFAULTICON_PATH as CLIENT_WEGAME_DEFAULTICON_PATH,
  type ClientInstallationMainContext
} from './context'
import { ClientInstallationDetector } from './installation-detector'
import { ClientInstallationIpcHandlers } from './ipc-handlers'
import { ClientInstallationJumpListController } from './jump-list-controller'
import { LiveStreamingDetector } from './live-streaming-detector'
import { ClientInstallationState } from './state'

/**
 * 情报搜集模块
 */
@Shard(ClientInstallationMain.id)
export class ClientInstallationMain implements IAkariShardInitDispose {
  static id = CLIENT_INSTALLATION_MAIN_NAMESPACE

  static readonly TENCENT_REG_INSTALL_PATH = CLIENT_TENCENT_REG_INSTALL_PATH
  static readonly TENCENT_REG_INSTALL_VALUE = CLIENT_TENCENT_REG_INSTALL_VALUE
  static readonly TENCENT_INSTALL_DIRNAME = CLIENT_TENCENT_INSTALL_DIRNAME
  static readonly TENCENT_LOL_DIRNAME = CLIENT_TENCENT_LOL_DIRNAME
  static readonly WEGAME_DEFAULTICON_PATH = CLIENT_WEGAME_DEFAULTICON_PATH

  static readonly LIVE_STREAMING_CLIENTS = CLIENT_LIVE_STREAMING_CLIENTS
  static readonly LIVE_STREAMING_CLIENT_POLL_INTERVAL = CLIENT_LIVE_STREAMING_CLIENT_POLL_INTERVAL

  public readonly state = new ClientInstallationState()

  private readonly _logger: AkariLogger
  private readonly _context: ClientInstallationMainContext
  private readonly _installationDetector: ClientInstallationDetector
  private readonly _launcher: ClientInstallationLauncher
  private readonly _ipcHandlers: ClientInstallationIpcHandlers
  private readonly _jumpListController: ClientInstallationJumpListController
  private readonly _liveStreamingDetector: LiveStreamingDetector

  private _liveStreamingTimer: NodeJS.Timeout | null = null

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _appCommon: AppCommonMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _shared: SharedGlobalShard
  ) {
    this._logger = _loggerFactory.create(ClientInstallationMain.id)
    this._context = {
      namespace: ClientInstallationMain.id,
      state: this.state,
      logger: this._logger,
      appCommon: this._appCommon,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      shared: this._shared
    }

    this._installationDetector = new ClientInstallationDetector(this._context)
    this._launcher = new ClientInstallationLauncher(this._context)
    this._ipcHandlers = new ClientInstallationIpcHandlers(this._context, this._launcher)
    this._jumpListController = new ClientInstallationJumpListController(
      this._context,
      this._launcher
    )
    this._liveStreamingDetector = new LiveStreamingDetector(this._context)
  }

  async onInit() {
    this._setupState()
    this._ipcHandlers.register()
    await this._installationDetector.runPlatformDetection()
    this._jumpListController.register()
    this._liveStreamingTimer = this._liveStreamingDetector.watch()
  }

  private _setupState() {
    this._mobxUtils.propSync(ClientInstallationMain.id, 'state', this.state, [
      'leagueClientExecutablePaths',
      'tencentInstallationPath',
      'weGameExecutablePath',
      'officialRiotClientExecutablePath',
      'tclsExecutablePath',
      'weGameLauncherExecutablePath',
      'detectedLiveStreamingClients'
    ])
  }

  async onDispose() {
    if (this._liveStreamingTimer) {
      clearInterval(this._liveStreamingTimer)
    }
  }
}
