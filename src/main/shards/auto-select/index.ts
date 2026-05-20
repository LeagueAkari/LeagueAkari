import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoSelectActions } from './actions'
import { AutoSelectBanPickController } from './ban-pick-controller'
import { AutoSelectBenchController } from './bench-controller'
import { AutoSelectConfigManager } from './config-manager'
import { AUTO_SELECT_MAIN_NAMESPACE, type AutoSelectMainContext } from './context'
import { AutoSelectIpcHandlers } from './ipc-handlers'
import { AutoSelectLocalMessageService } from './local-message-service'
import { AutoSelectSettings, AutoSelectState } from './state'
import { AutoSelectTradeController } from './trade-controller'

@Shard(AutoSelectMain.id)
export class AutoSelectMain implements IAkariShardInitDispose {
  static id = AUTO_SELECT_MAIN_NAMESPACE

  public readonly settings = new AutoSelectSettings()
  public readonly state: AutoSelectState

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AutoSelectMainContext

  private readonly _localMessage: AutoSelectLocalMessageService
  private readonly _actions: AutoSelectActions
  private readonly _configManager: AutoSelectConfigManager
  private readonly _ipcHandlers: AutoSelectIpcHandlers
  private readonly _banPick: AutoSelectBanPickController
  private readonly _benchController: AutoSelectBenchController
  private readonly _tradeController: AutoSelectTradeController

  constructor(
    loggerFactory: LoggerFactoryMain,
    settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this._logger = loggerFactory.create(AutoSelectMain.id)
    this.state = new AutoSelectState(
      this._leagueClient.data,
      this.settings,
      this._remoteConfig.state
    )
    this._settingService = settingFactory.register(
      AutoSelectMain.id,
      {
        pickConfig: { default: this.settings.pickConfig },
        banConfig: { default: this.settings.banConfig }
      },
      this.settings
    )

    this._context = {
      namespace: AutoSelectMain.id,
      settings: this.settings,
      state: this.state,
      logger: this._logger,
      settingService: this._settingService,
      leagueClient: this._leagueClient,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc
    }

    this._localMessage = new AutoSelectLocalMessageService(this._context)
    this._actions = new AutoSelectActions(this._context, this._localMessage)
    this._configManager = new AutoSelectConfigManager(this._context)
    this._ipcHandlers = new AutoSelectIpcHandlers(this._context)
    this._banPick = new AutoSelectBanPickController(
      this._context,
      this._localMessage,
      this._actions
    )
    this._benchController = new AutoSelectBenchController(
      this._context,
      this._localMessage,
      this._actions
    )
    this._tradeController = new AutoSelectTradeController(
      this._context,
      this._localMessage,
      this._actions
    )
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(AutoSelectMain.id, 'settings', this.settings, [
      'pickConfig',
      'banConfig'
    ])

    this._mobxUtils.propSync(AutoSelectMain.id, 'state', this.state, [
      'groups',
      'temporarilyDisabled',
      'delayedBan',
      'delayedPick',
      'delayedBenchSwap',
      'delayedChampionSwap',
      'expectedPicks',
      'expectedBans',
      'expectedSwaps',
      'activeGroupConfigId'
    ])

    await this._configManager.fillAutoBanPickConfig()
  }

  async onInit() {
    await this._setupState()
    this._ipcHandlers.register()
    this._localMessage.watch()
    this._banPick.watch()
    this._benchController.watch()
    this._tradeController.watch()
  }
}
