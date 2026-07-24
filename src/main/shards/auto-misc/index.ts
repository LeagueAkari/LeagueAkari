import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { z } from 'zod'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoMiscAutoReplyController } from './auto-reply-controller'
import {
  AUTO_MISC_MAIN_NAMESPACE,
  AUTO_MISC_SETTING_KEYS,
  type AutoMiscMainContext
} from './context'
import { AutoMiscIpcHandlers } from './ipc-handlers'
import { AutoMiscLoginAutomationController } from './login-automation-controller'
import { AutoMiscSettings } from './state'

@Shard(AutoMiscMain.id)
export class AutoMiscMain implements IAkariShardInitDispose {
  static id = AUTO_MISC_MAIN_NAMESPACE

  public readonly settings = new AutoMiscSettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AutoMiscMainContext
  private readonly _autoReplyController: AutoMiscAutoReplyController
  private readonly _loginAutomationController: AutoMiscLoginAutomationController
  private readonly _ipcHandlers: AutoMiscIpcHandlers

  constructor(
    loggerFactory: LoggerFactoryMain,
    settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._logger = loggerFactory.create(AutoMiscMain.id)
    this._settingService = settingFactory.register(
      AutoMiscMain.id,
      {
        autoReplyEnabled: { default: this.settings.autoReplyEnabled, schema: z.boolean() },
        autoReplyEnableOnAway: {
          default: this.settings.autoReplyEnableOnAway,
          schema: z.boolean()
        },
        autoReplyText: { default: this.settings.autoReplyText, schema: z.string() },
        lockOfflineStatus: { default: this.settings.lockOfflineStatus, schema: z.boolean() },
        autoSetStatusMessageEnabled: {
          default: this.settings.autoSetStatusMessageEnabled,
          schema: z.boolean()
        },
        statusMessage: { default: this.settings.statusMessage, schema: z.string() },
        autoSetRankedStatusEnabled: {
          default: this.settings.autoSetRankedStatusEnabled,
          schema: z.boolean()
        },
        rankedStatus: {
          default: this.settings.rankedStatus,
          schema: z.object({
            queue: z.string(),
            tier: z.enum([
              'IRON',
              'BRONZE',
              'SILVER',
              'GOLD',
              'PLATINUM',
              'EMERALD',
              'DIAMOND',
              'MASTER',
              'GRANDMASTER',
              'CHALLENGER'
            ]),
            division: z.enum(['I', 'II', 'III', 'IV'])
          })
        }
      },
      this.settings
    )
    this._context = {
      namespace: AutoMiscMain.id,
      settings: this.settings,
      logger: this._logger,
      leagueClient: this._leagueClient,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc
    }
    this._autoReplyController = new AutoMiscAutoReplyController(this._context)
    this._loginAutomationController = new AutoMiscLoginAutomationController(this._context)
    this._ipcHandlers = new AutoMiscIpcHandlers(this._context, this._loginAutomationController)
  }

  async onInit() {
    await this._settingService.applyToState()
    this._context.mobxUtils.propSync(AutoMiscMain.id, 'settings', this.settings, [
      ...AUTO_MISC_SETTING_KEYS
    ])

    this._ipcHandlers.register()
    this._autoReplyController.watch()
    this._loginAutomationController.watch()
  }
}
