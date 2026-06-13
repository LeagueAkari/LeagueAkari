import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { sleep } from '@shared/utils/sleep'

import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'

type SendablePhase = 'champ-select' | 'lobby' | 'in-game'

export function normalizeInGameSendLines(lines: string[]) {
  return lines.filter((line) => line.trim().length > 0)
}

export class InGameSendExecutor {
  private _currentSendController: AbortController | null = null

  constructor(private readonly _context: InGameSendMainContext) {}

  watchCancelShortcut() {
    const { keyboardShortcuts, logger, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => settings.cancelShortcut,
      (shortcut) => {
        const targetId = `${IN_GAME_SEND_MAIN_NAMESPACE}/cancel`

        if (shortcut === null) {
          keyboardShortcuts.unregisterByTargetId(targetId)
        } else {
          try {
            keyboardShortcuts.register(targetId, shortcut, 'normal', () => {
              if (this._currentSendController) {
                this._currentSendController.abort()
              }
            })
          } catch (error) {
            settings.setCancelShortcut(null)
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
   * 任何正在进行的发送任务都会先被 abort。
   *
   * 给后续预设（preset）执行使用。
   */
  async sendLines(lines: string[]) {
    const { isGameClientForeground, logger, ongoingGame } = this._context

    if (this._currentSendController) {
      logger.info('Existing task in progress, cancelling')
      this._currentSendController.abort()
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

    if (phase === 'in-game' && !(await isGameClientForeground())) {
      logger.warn('Game client is not foreground')
      return false
    }

    const controller = new AbortController()
    this._currentSendController = controller

    try {
      return await this._sendTextToChatOrInGame(phase, normalizedLines, controller.signal)
    } finally {
      if (this._currentSendController === controller) {
        this._currentSendController = null
      }
    }
  }

  private async _sendTextToChatOrInGame(
    phase: SendablePhase,
    lines: string[],
    signal: AbortSignal
  ) {
    const { leagueClient, logger, settings } = this._context

    if (phase === 'champ-select' || phase === 'lobby') {
      const conversation =
        phase === 'champ-select'
          ? leagueClient.data.chat.conversations.championSelect
          : leagueClient.data.chat.conversations.customGame

      if (!conversation) {
        return false
      }

      if (signal.aborted) {
        return false
      }

      logger.info('Sending message through LCU chat', phase, lines)
      return await leagueClient.api.chat
        .chatSend(conversation.id, lines.join('\n'))
        .then(() => true)
        .catch(() => false)
    } else if (phase === 'in-game') {
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
          break
        }

        await pressEnter()
        await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
        await instance.sendString(lines[index])
        await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
        await pressEnter()

        if (index !== lines.length - 1) {
          await sleep(settings.sendInterval)
        }
      }

      return !signal.aborted
    }

    return false
  }
}
