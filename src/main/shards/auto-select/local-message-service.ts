import { i18next } from '@main/i18n'

import type { AutoSelectMainContext } from './context'

export class AutoSelectLocalMessageService {
  private _backloggedMessages: (() => string)[] = []

  constructor(private readonly _context: AutoSelectMainContext) {}

  watch() {
    const { mobxUtils, state } = this._context

    mobxUtils.reaction(
      () => state.chatId,
      (chatId) => {
        if (!chatId) {
          return
        }

        const sendMessages = async () => {
          while (this._backloggedMessages.length) {
            const message = this._backloggedMessages.shift()
            if (message) {
              await this.send(message())
            }
          }
        }

        sendMessages()
      }
    )

    mobxUtils.reaction(
      () => state.inChampSelect,
      (hasChampSelectSession) => {
        if (!hasChampSelectSession) {
          this._backloggedMessages = []
          state.setTemporarilyDisabled(false)
          return
        }
      }
    )
  }

  async send(message: string) {
    const { leagueClient, state } = this._context

    if (!state.inChampSelect) {
      return
    }

    if (!state.chatId) {
      this._backloggedMessages.push(() => message)
      return
    }

    await leagueClient.api.chat
      .chatSend(
        state.chatId,
        `[${i18next.t('appName', { ns: 'common' })}] ${message}`,
        // LCU 的 "celebration" 类型用于仅本地玩家可见的系统提示。
        'celebration'
      )
      .catch(() => {})
  }
}
