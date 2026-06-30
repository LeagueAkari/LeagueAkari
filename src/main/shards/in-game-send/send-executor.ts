import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { sleep } from '@shared/utils/sleep'

import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'

type ChatPhase = 'champ-select' | 'lobby'
type SendablePhase = ChatPhase | 'in-game'

export function normalizeInGameSendLines(lines: string[]) {
  return lines.filter((line) => line.trim().length > 0)
}

export class InGameSendExecutor {
  private _currentKeyboardSendController: AbortController | null = null

  constructor(private readonly _context: InGameSendMainContext) {}

  watchCancelShortcut() {
    const { keyboardShortcuts, logger, mobxUtils, settingService, settings } = this._context

    mobxUtils.reaction(
      () => settings.cancelShortcut,
      (shortcut) => {
        const targetId = `${IN_GAME_SEND_MAIN_NAMESPACE}/cancel`

        if (shortcut === null) {
          keyboardShortcuts.unregisterByTargetId(targetId)
        } else {
          try {
            keyboardShortcuts.register(targetId, shortcut, 'normal', () => {
              if (this._currentKeyboardSendController) {
                this._currentKeyboardSendController.abort()
              }
            })
          } catch (error) {
            void settingService.set('cancelShortcut', null).catch((setError) => {
              logger.error('Clear cancel shortcut setting failed', setError)
            })
            logger.error('Register shortcut failed', error)
          }
        }
      },
      { fireImmediately: true }
    )
  }

  /**
   * 触发一次发送任务：根据当前 phase 把 `lines` 发送到对应通道。
   * 选人 / 房间阶段合并为一条 LCU 聊天消息；游戏内逐条模拟发送。
   * 任何正在进行的游戏内键盘发送任务都会先被 abort。
   *
   * 给后续预设（preset）执行使用。
   */
  async sendLines(lines: string[]) {
    const { isGameClientForeground, logger, ongoingGame } = this._context

    if (this._currentKeyboardSendController) {
      logger.info('Existing in-game keyboard send task in progress, cancelling')
      this._currentKeyboardSendController.abort()
    }

    const normalizedLines = normalizeInGameSendLines(lines)
    if (!normalizedLines.length) {
      return false
    }

    if (
      ongoingGame.state.queryStage.phase !== 'champ-select' &&
      ongoingGame.state.queryStage.phase !== 'lobby' &&
      ongoingGame.state.queryStage.phase !== 'in-game'
    ) {
      return false
    }

    const phase = ongoingGame.state.queryStage.phase

    if (this._isChatPhase(phase)) {
      return await this._sendLinesToChat(phase, normalizedLines)
    }

    if (!(await isGameClientForeground())) {
      logger.warn('Game client is not foreground')
      return false
    }

    const controller = new AbortController()
    this._currentKeyboardSendController = controller

    try {
      return await this._sendLinesInGame(normalizedLines, controller.signal)
    } finally {
      if (this._currentKeyboardSendController === controller) {
        this._currentKeyboardSendController = null
      }
    }
  }

  private _isChatPhase(phase: SendablePhase): phase is ChatPhase {
    return phase === 'champ-select' || phase === 'lobby'
  }

  private async _sendLinesToChat(phase: ChatPhase, lines: string[]) {
    const { leagueClient, logger } = this._context
    const conversation =
      phase === 'champ-select'
        ? leagueClient.data.chat.conversations.championSelect
        : leagueClient.data.chat.conversations.customGame

    if (!conversation) {
      return false
    }

    logger.info('Sending message through LCU chat', phase, lines)
    return await leagueClient.api.chat
      .chatSend(conversation.id, lines.join('\n'))
      .then(() => true)
      .catch(() => false)
  }

  private async _sendLinesInGame(lines: string[], signal: AbortSignal) {
    const { logger, settings } = this._context

    if (!NATIVE_SUPPORT.nativeInput.available) {
      logger.warn('Native input is not available')
      return false
    }

    const instance = nativeInput.instance

    logger.info('Sending messages in-game', lines)

    const pressEnter = async () => {
      await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, true)
      await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
      await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, false)
    }

    for (let index = 0; index < lines.length; index++) {
      if (signal.aborted) {
        return false
      }

      await pressEnter()

      if (signal.aborted) {
        return false
      }

      await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
      await instance.sendString(lines[index])

      if (signal.aborted) {
        return false
      }

      await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
      await pressEnter()

      if (signal.aborted) {
        return false
      }

      if (index !== lines.length - 1) {
        await sleep(settings.sendInterval)
      }
    }

    return !signal.aborted
  }
}
