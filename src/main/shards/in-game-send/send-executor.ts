import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'

import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'
import type { InGameSendTemplateManager } from './template-manager'

export class InGameSendExecutor {
  private _currentSendController: AbortController | null = null

  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _templateManager: InGameSendTemplateManager
  ) {}

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

  performSendableItemSend(id: string, target: 'all' | 'ally' | 'enemy') {
    const { gameClientClass, ipc, logger, ongoingGame, settings } = this._context

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

    if (
      ongoingGame.state.queryStage.phase === 'in-game' &&
      !gameClientClass.isGameClientForeground()
    ) {
      logger.warn('Game client is not foreground')
      return
    }

    const sendableItem = settings.sendableItems.find((item) => item.id === id)

    if (!sendableItem) {
      logger.warn('Send item not found', id)
      return
    }

    if (!sendableItem.enabled) {
      return
    }

    this._currentSendController = new AbortController()

    if (sendableItem.content.type === 'plaintext') {
      this._sendTextToChatOrInGame(
        sendableItem.content.content.split('\n'),
        this._currentSendController.signal
      )
    } else if (sendableItem.content.type === 'template' && sendableItem.content.templateId) {
      try {
        const lines = this._templateManager.getTemplateMessages(
          sendableItem.content.templateId,
          target
        )
        if (lines) {
          this._sendTextToChatOrInGame(lines, this._currentSendController.signal)
          ipc.sendEvent(IN_GAME_SEND_MAIN_NAMESPACE, 'success-template-execution-succeeded', {
            templateId: sendableItem.content.templateId
          })
        }
      } catch (error) {
        logger.warn('Template execution failed', sendableItem.content.templateId, error)
        this._currentSendController = null
        ipc.sendEvent(IN_GAME_SEND_MAIN_NAMESPACE, 'error-template-execution-failed', {
          templateId: sendableItem.content.templateId,
          error: formatError(error)
        })
      }
    } else {
      logger.warn('Unknown template type', sendableItem.content)
    }
  }

  sendTemplateInChampSelectChat(templateId: string, target: 'ally' | 'enemy' | 'all') {
    const { leagueClient, logger, settings } = this._context
    const { messages, error } = this._templateManager.getDryRunResult(templateId, target)

    if (error) {
      return { error }
    }

    const conversation = leagueClient.data.chat.conversations.championSelect

    if (!conversation) {
      logger.warn('Champion select chat not found')
      return { error: 'Champion select chat not found' }
    }

    logger.info('Sending message during champion select, manually', messages)

    const interval = settings.sendInterval
    const tasks: (() => Promise<any>)[] = []

    for (let index = 0; index < messages.length; index++) {
      tasks.push(() =>
        leagueClient.api.chat.chatSend(conversation.id, messages[index]).catch(() => {})
      )

      if (index !== messages.length - 1) {
        tasks.push(() => sleep(interval))
      }
    }

    const runTasks = async () => {
      for (const task of tasks) {
        await task()
      }
    }

    runTasks()

    return { error: null }
  }

  private _sendTextToChatOrInGame(strs: string[], signal: AbortSignal) {
    const { leagueClient, logger, ongoingGame, settings } = this._context

    if (!NATIVE_SUPPORT.nativeInput.available) {
      logger.warn('Native input is not available')
    }

    const instance = nativeInput.instance

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
