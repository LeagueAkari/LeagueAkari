import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { sleep } from '@shared/utils/sleep'

import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'

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
   * 触发一次发送任务：根据当前 phase（champ-select / in-game）把 `lines` 逐行
   * 发送到对应通道。任何正在进行的发送任务都会先被 abort。
   *
   * 给后续预设（preset）执行使用。
   */
  async sendLines(lines: string[]) {
    const { isGameClientForeground, logger, ongoingGame } = this._context

    if (this._currentSendController) {
      logger.info('Existing task in progress, cancelling')
      this._currentSendController.abort()
    }

    if (
      ongoingGame.state.queryStage.phase !== 'champ-select' &&
      ongoingGame.state.queryStage.phase !== 'in-game'
    ) {
      logger.warn(
        'Current phase does not support sending messages',
        ongoingGame.state.queryStage.phase
      )
      return
    }

    if (ongoingGame.state.queryStage.phase === 'in-game' && !(await isGameClientForeground())) {
      logger.warn('Game client is not foreground')
      return
    }

    this._currentSendController = new AbortController()
    this._sendTextToChatOrInGame(lines, this._currentSendController.signal)
  }

  private _sendTextToChatOrInGame(strs: string[], signal: AbortSignal) {
    const { leagueClient, logger, ongoingGame, settings } = this._context

    let aborted = false
    signal.addEventListener('abort', () => {
      aborted = true
    })

    const interval = settings.sendInterval
    const tasks: (() => Promise<any>)[] = []

    if (ongoingGame.state.queryStage.phase === 'champ-select') {
      const conversation = leagueClient.data.chat.conversations.championSelect

      if (!conversation) {
        logger.warn('Champion select chat not found')
        return
      }

      logger.info('Sending message during champion select', strs)

      for (let index = 0; index < strs.length; index++) {
        tasks.push(() =>
          leagueClient.api.chat.chatSend(conversation.id, strs[index]).catch(() => {})
        )

        if (index !== strs.length - 1) {
          tasks.push(() => sleep(interval))
        }
      }
    } else if (ongoingGame.state.queryStage.phase === 'in-game') {
      if (!NATIVE_SUPPORT.nativeInput.available) {
        logger.warn('Native input is not available')
        return
      }

      const instance = nativeInput.instance

      logger.info('Sending message in-game', strs)

      for (let index = 0; index < strs.length; index++) {
        tasks.push(async () => {
          await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, true)
          await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
          await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, false)
          await sleep(interval)
          await instance.sendString(strs[index])
          await sleep(interval)
          await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, true)
          await sleep(IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY)
          await instance.sendKey(IN_GAME_SEND_ENTER_KEY_CODE, false)
        })

        if (index !== strs.length - 1) {
          tasks.push(() => sleep(interval))
        }
      }
    } else {
      return
    }

    const runTasks = async () => {
      for (const task of tasks) {
        if (aborted) {
          break
        }

        await task()
      }
    }

    runTasks()
  }
}
