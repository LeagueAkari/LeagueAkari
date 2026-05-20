import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { ChatMessage } from '@shared/types/league-client/chat'
import { LcuEvent } from '@shared/types/league-client/event'
import { formatError } from '@shared/utils/errors'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoReplySettings } from './state'

/**
 * 聊天自动回复相关功能
 */
@Shard(AutoReplyMain.id)
export class AutoReplyMain implements IAkariShardInitDispose {
  static id = 'auto-reply-main'

  public readonly settings = new AutoReplySettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
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
  }

  async onInit() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(AutoReplyMain.id, 'settings', this.settings, [
      'enabled',
      'enableOnAway',
      'text',
      'lockOfflineStatus'
    ])

    // 原始人的方法！
    this._leagueClient.events.on<LcuEvent<ChatMessage>>(
      '/lol-chat/v1/conversations/:fromId/messages/:messageId',
      async (event, { fromId }) => {
        if (
          this.settings.enabled &&
          event.data &&
          this._leagueClient.data.summoner.me &&
          event.data.type === 'chat' &&
          event.data.fromSummonerId !== this._leagueClient.data.summoner.me.summonerId &&
          this.settings.text
        ) {
          if (
            this.settings.enableOnAway &&
            this._leagueClient.data.chat.me?.availability !== 'away'
          ) {
            return
          }

          try {
            await this._leagueClient.api.chat.chatSend(fromId, this.settings.text)
            this._logger.info(`Auto-replied to ${fromId}, content: ${this.settings.text}`)
          } catch (error) {
            this._ipc.sendEvent(AutoReplyMain.id, 'error-send-failed', {
              error: formatError(error)
            })
            this._logger.warn(`Failed to auto-reply`, formatError(error))
          }
        }
      }
    )

    this._mobxUtils.reaction(
      () => this._leagueClient.data.chat.me?.availability,
      (availability, prev) => {
        if (!availability || !this.settings.lockOfflineStatus) {
          return
        }

        if (prev === 'offline' && (availability === 'away' || availability === 'chat')) {
          this._logger.info('Correcting to offline status')
          this._leagueClient.api.chat.changeAvailability('offline').catch((error) => {
            this._logger.warn(`Failed to change status`, error)
          })
        }
      }
    )
  }
}
