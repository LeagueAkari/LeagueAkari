import type { ChatMessage } from '@shared/types/league-client/chat'
import type { LcuEvent } from '@shared/types/league-client/event'
import { formatError } from '@shared/utils/errors'

import type { AutoReplyMainContext } from './context'

export class AutoReplyController {
  constructor(private readonly context: AutoReplyMainContext) {}

  watch() {
    this._watchIncomingMessages()
    this._watchOfflineStatusLock()
  }

  private _watchIncomingMessages() {
    const { ipc, leagueClient, logger, namespace, settings } = this.context

    // 原始人的方法！
    leagueClient.events.on<LcuEvent<ChatMessage>>(
      '/lol-chat/v1/conversations/:fromId/messages/:messageId',
      async (event, { fromId }) => {
        if (
          settings.enabled &&
          event.data &&
          leagueClient.data.summoner.me &&
          event.data.type === 'chat' &&
          event.data.fromSummonerId !== leagueClient.data.summoner.me.summonerId &&
          settings.text
        ) {
          if (settings.enableOnAway && leagueClient.data.chat.me?.availability !== 'away') {
            return
          }

          try {
            await leagueClient.api.chat.chatSend(fromId, settings.text)
            logger.info(`Auto-replied to ${fromId}, content: ${settings.text}`)
          } catch (error) {
            ipc.sendEvent(namespace, 'error-send-failed', {
              error: formatError(error)
            })
            logger.warn(`Failed to auto-reply`, formatError(error))
          }
        }
      }
    )
  }

  private _watchOfflineStatusLock() {
    const { leagueClient, logger, mobxUtils, settings } = this.context

    mobxUtils.reaction(
      () => leagueClient.data.chat.me?.availability,
      (availability, prev) => {
        if (!availability || !settings.lockOfflineStatus) {
          return
        }

        if (prev === 'offline' && (availability === 'away' || availability === 'chat')) {
          logger.info('Correcting to offline status')
          leagueClient.api.chat.changeAvailability('offline').catch((error) => {
            logger.warn(`Failed to change status`, error)
          })
        }
      }
    )
  }
}
