import type { ChatMessage } from '@shared/types/league-client/chat'
import type { LcuEvent } from '@shared/types/league-client/event'
import { formatError } from '@shared/utils/errors'

import type { AutoMiscMainContext } from './context'

export class AutoMiscAutoReplyController {
  constructor(private readonly _context: AutoMiscMainContext) {}

  watch() {
    this._watchIncomingMessages()
    this._watchOfflineStatusLock()
  }

  private _watchIncomingMessages() {
    const { leagueClient } = this._context

    leagueClient.events.on<LcuEvent<ChatMessage>>(
      '/lol-chat/v1/conversations/:fromId/messages/:messageId',
      async (event, { fromId }) => {
        const { ipc, logger, namespace, settings } = this._context

        if (
          settings.autoReplyEnabled &&
          event.data &&
          leagueClient.data.summoner.me &&
          event.data.type === 'chat' &&
          event.data.fromSummonerId !== leagueClient.data.summoner.me.summonerId &&
          settings.autoReplyText
        ) {
          if (
            settings.autoReplyEnableOnAway &&
            leagueClient.data.chat.me?.availability !== 'away'
          ) {
            return
          }

          try {
            await leagueClient.api.chat.chatSend(fromId, settings.autoReplyText)
            logger.info(`Auto-replied to ${fromId}, content: ${settings.autoReplyText}`)
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
    const { leagueClient, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => leagueClient.data.chat.me?.availability,
      (availability, prev) => {
        const { logger } = this._context

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
