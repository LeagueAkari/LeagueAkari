import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { normalizeInGameSendPresetOptions } from '@shared/types/shards/in-game-send'

import { AppCommonMain } from '../app-common'
import { GameClientMain } from '../game-client'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { OngoingGameMain } from '../ongoing-game'
import { RemoteConfigMain } from '../remote-config'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'
import { InGameSendIpcHandlers } from './ipc-handlers'
import { InGameSendPresetController } from './preset-controller'
import { InGameSendPresetSelectionController } from './preset-selection-controller'
import { InGameSendExecutor } from './send-executor'
import { InGameSendSettings, InGameSendState } from './state'

/**
 * 用于在游戏中模拟发送的相关功能
 *  - 游戏内发送消息
 *  - 英雄选择阶段发送消息
 *  - 一些其他的发送场景
 *
 * 模板（template）/ 用户可自定义 sendable item 设计已废弃，后续以固定预设
 * （preset）替代。预设的注册表与触发器尚未实现。
 */
@Shard(InGameSendMain.id)
export class InGameSendMain implements IAkariShardInitDispose {
  static id = IN_GAME_SEND_MAIN_NAMESPACE

  static ENTER_KEY_CODE = IN_GAME_SEND_ENTER_KEY_CODE
  static ENTER_KEY_INTERNAL_DELAY = IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: InGameSendMainContext

  private readonly _sendExecutor: InGameSendExecutor
  private readonly _presetController: InGameSendPresetController
  private readonly _presetSelectionController: InGameSendPresetSelectionController
  private readonly _ipcHandlers: InGameSendIpcHandlers

  constructor(
    settingFactory: SettingFactoryMain,
    loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _keyboardShortcuts: KeyboardShortcutsMain,
    private readonly _ongoingGame: OngoingGameMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _shared: SharedGlobalShard,
    private readonly _appCommon: AppCommonMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this._logger = loggerFactory.create(InGameSendMain.id)
    this._settingService = settingFactory.register(
      InGameSendMain.id,
      {
        sendInterval: { default: this.settings.sendInterval },
        cancelShortcut: { default: this.settings.cancelShortcut },
        presetOptions: { default: this.settings.presetOptions }
      },
      this.settings
    )

    this._context = {
      namespace: InGameSendMain.id,
      settings: this.settings,
      state: this.state,
      logger: this._logger,
      settingService: this._settingService,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc,
      keyboardShortcuts: this._keyboardShortcuts,
      ongoingGame: this._ongoingGame,
      leagueClient: this._leagueClient,
      shared: this._shared,
      appCommon: this._appCommon,
      remoteConfig: this._remoteConfig,

      isGameClientForeground: () => {
        return GameClientMain.isGameClientForeground()
      }
    }

    this._sendExecutor = new InGameSendExecutor(this._context)
    this._presetController = new InGameSendPresetController(this._context, this._sendExecutor)
    this._presetSelectionController = new InGameSendPresetSelectionController(this._context)
    this._ipcHandlers = new InGameSendIpcHandlers(
      this._context,
      this._sendExecutor,
      this._presetController,
      this._presetSelectionController
    )
  }

  private async _setupState() {
    await this._settingService.applyToState()
    this.settings.setPresetOptions(this.settings.presetOptions)

    this._mobxUtils.propSync(InGameSendMain.id, 'settings', this.settings, [
      'sendInterval',
      'cancelShortcut',
      'presetOptions'
    ])

    this._mobxUtils.propSync(InGameSendMain.id, 'state', this.state, [
      'ratingPuuids',
      'junglePuuids',
      'premadeIndices'
    ])

    this._settingService.onChange('sendInterval', (value, { setter }) => {
      if (value < 0) {
        return setter(0)
      }

      return setter(value)
    })

    this._settingService.onChange('presetOptions', (value, { setter }) => {
      return setter(normalizeInGameSendPresetOptions(value))
    })
  }

  async onInit() {
    await this._setupState()

    this._sendExecutor.watchCancelShortcut()
    this._presetController.start()
    this._presetSelectionController.start()
    this._ipcHandlers.register()
  }

  async onDispose() {}
}
