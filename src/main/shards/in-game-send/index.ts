import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'

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
  IN_GAME_SEND_MAX_ITEMS,
  type InGameSendMainContext
} from './context'
import { InGameSendIpcHandlers } from './ipc-handlers'
import { InGameSendExecutor } from './send-executor'
import { InGameSendSendableItemManager } from './sendable-item-manager'
import { InGameSendSettings, InGameSendState } from './state'
import { InGameSendTemplateManager } from './template-manager'

/**
 * 用于在游戏中模拟发送的相关功能
 *  - 游戏内发送消息
 *  - 英雄选择阶段发送消息
 *  - 一些其他的发送场景
 */
@Shard(InGameSendMain.id)
export class InGameSendMain implements IAkariShardInitDispose {
  static id = IN_GAME_SEND_MAIN_NAMESPACE

  static MAX_ITEMS = IN_GAME_SEND_MAX_ITEMS
  static ENTER_KEY_CODE = IN_GAME_SEND_ENTER_KEY_CODE
  static ENTER_KEY_INTERNAL_DELAY = IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: InGameSendMainContext

  private readonly _templates: InGameSendTemplateManager
  private readonly _sendExecutor: InGameSendExecutor
  private readonly _sendableItems: InGameSendSendableItemManager
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
        sendableItems: { default: this.settings.sendableItems },
        sendInterval: { default: this.settings.sendInterval },
        templates: { default: this.settings.templates },
        cancelShortcut: { default: this.settings.cancelShortcut }
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
      gameClientClass: GameClientMain
    }

    this._templates = new InGameSendTemplateManager(this._context)
    this._sendExecutor = new InGameSendExecutor(this._context, this._templates)
    this._sendableItems = new InGameSendSendableItemManager(this._context, this._sendExecutor)
    this._ipcHandlers = new InGameSendIpcHandlers(
      this._context,
      this._sendableItems,
      this._templates,
      this._sendExecutor
    )
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(InGameSendMain.id, 'settings', this.settings, [
      'sendInterval',
      'templates',
      'sendableItems',
      'cancelShortcut'
    ])

    this._settingService.onChange('sendInterval', (value, { setter }) => {
      if (value < 0) {
        return setter(0)
      }

      return setter(value)
    })
  }

  async onInit() {
    await this._setupState()

    this._templates.checkAndInitTemplates()
    this._sendableItems.checkAndInitShortcuts()
    this._templates.watchTemplateAutoDeprecation()
    this._sendExecutor.watchCancelShortcut()
    this._ipcHandlers.register()

    this._templates.autoBootstrapTemplatesIfNeeded((data) =>
      this._sendableItems.createSendableItem(data)
    )
  }
}
