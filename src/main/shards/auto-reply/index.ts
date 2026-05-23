import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoReplyController } from './auto-reply-controller'
import { AUTO_REPLY_MAIN_NAMESPACE, type AutoReplyMainContext } from './context'
import { AutoReplySettings } from './state'

/**
 * 聊天自动回复相关功能
 */
@Shard(AutoReplyMain.id)
export class AutoReplyMain implements IAkariShardInitDispose {
  static id = AUTO_REPLY_MAIN_NAMESPACE

  public readonly settings = new AutoReplySettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AutoReplyMainContext
  private readonly _controller: AutoReplyController

  constructor(
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._logger = _loggerFactory.create(AutoReplyMain.id)
    this._settingService = _settingFactory.register(
      AutoReplyMain.id,
      {
        enabled: { default: this.settings.enabled },
        enableOnAway: { default: this.settings.enableOnAway },
        text: { default: this.settings.text },
        lockOfflineStatus: { default: this.settings.lockOfflineStatus }
      },
      this.settings
    )

    this._context = {
      namespace: AutoReplyMain.id,
      ipc: this._ipc,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings,
      settingService: this._settingService
    }
    this._controller = new AutoReplyController(this._context)
  }

  async onInit() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(AutoReplyMain.id, 'settings', this.settings, [
      'enabled',
      'enableOnAway',
      'text',
      'lockOfflineStatus'
    ])

    this._controller.watch()
  }
}
