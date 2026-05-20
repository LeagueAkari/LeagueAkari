import { i18next } from '@main/i18n'

import {
  IN_GAME_SEND_MAIN_NAMESPACE,
  IN_GAME_SEND_MAX_ITEMS,
  type InGameSendMainContext
} from './context'
import type { InGameSendExecutor } from './send-executor'
import { SendableItem } from './state'

export class InGameSendSendableItemManager {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  checkAndInitShortcuts() {
    const { settingService, settings } = this._context
    let oneOfThemMutated = false

    for (const item of settings.sendableItems) {
      const [, mutated] = this._tryApplyingSendableItemShortcuts(item)
      if (mutated) {
        oneOfThemMutated = true
      }
    }

    if (oneOfThemMutated) {
      settingService.set('sendableItems', [...settings.sendableItems])
    }
  }

  createSendableItem(data?: Partial<SendableItem>) {
    const { ipc, settingService, settings } = this._context

    if (settings.sendableItems.length >= IN_GAME_SEND_MAX_ITEMS) {
      ipc.sendEvent(IN_GAME_SEND_MAIN_NAMESPACE, 'error-sendable-item-max-items-reached')
      return
    }

    const id = crypto.randomUUID()

    const sendableItem: SendableItem = {
      id,
      name:
        data?.name ||
        i18next.t('in-game-send-main.newSendableItem', {
          index: settings.sendableItems.length + 1
        }),
      enabled: data?.enabled || true,
      sendAllShortcut: data?.sendAllShortcut || null,
      sendAllyShortcut: data?.sendAllyShortcut || null,
      sendEnemyShortcut: data?.sendEnemyShortcut || null,
      content: data?.content || {
        type: 'plaintext',
        content: ''
      }
    }

    const [boundItem] = this._tryApplyingSendableItemShortcuts(sendableItem)

    settingService.set('sendableItems', [...settings.sendableItems, boundItem])

    return sendableItem
  }

  async updateSendableItem(id: string, data: Partial<SendableItem>) {
    const { settingService, settings } = this._context
    const item = settings.sendableItems.find((sendableItem) => sendableItem.id === id)

    if (!item) {
      return
    }

    if (data.name !== undefined) {
      item.name = data.name
    }

    if (data.enabled !== undefined) {
      item.enabled = data.enabled
    }

    if (data.sendAllShortcut !== undefined) {
      item.sendAllShortcut = data.sendAllShortcut
    }

    if (item.content.type === 'template' && data.sendAllyShortcut !== undefined) {
      item.sendAllyShortcut = data.sendAllyShortcut
    }

    if (item.content.type === 'template' && data.sendEnemyShortcut !== undefined) {
      item.sendEnemyShortcut = data.sendEnemyShortcut
    }

    if (data.content !== undefined) {
      item.content = data.content

      if (data.content.type === 'plaintext') {
        item.sendAllyShortcut = null
        item.sendEnemyShortcut = null
      }
    }

    this._tryApplyingSendableItemShortcuts(item)

    settingService.set('sendableItems', [...settings.sendableItems])

    return item
  }

  async removeSendableItem(id: string) {
    const { settingService, settings } = this._context
    const item = settings.sendableItems.find((sendableItem) => sendableItem.id === id)

    if (item) {
      this._unregisterSendableItemShortcuts(item)
      settingService.set(
        'sendableItems',
        settings.sendableItems.filter((sendableItem) => sendableItem.id !== id)
      )
      return true
    }

    return false
  }

  private _getShortcutTargetId(id: string) {
    return {
      ally: `${IN_GAME_SEND_MAIN_NAMESPACE}/sendable-item/${id}/send-ally`,
      enemy: `${IN_GAME_SEND_MAIN_NAMESPACE}/sendable-item/${id}/send-enemy`,
      all: `${IN_GAME_SEND_MAIN_NAMESPACE}/sendable-item/${id}/send-all`
    }
  }

  private _tryApplyingSendableItemShortcuts(item: SendableItem) {
    const { keyboardShortcuts, logger } = this._context
    const { all, ally, enemy } = this._getShortcutTargetId(item.id)

    let mutated = false
    if (item.sendAllShortcut) {
      const registration = keyboardShortcuts.getRegistrationByTargetId(all)

      if (!registration || (registration && registration.shortcutId !== item.sendAllShortcut)) {
        if (registration) {
          keyboardShortcuts.unregisterByTargetId(all)
        }

        try {
          keyboardShortcuts.register(all, item.sendAllShortcut, 'last-active', () => {
            this._sendExecutor.performSendableItemSend(item.id, 'all')
          })
        } catch (error) {
          logger.error(`Add shortcut ${all} failed`, error)
          item.sendAllShortcut = null
          mutated = true
        }
      }
    } else {
      keyboardShortcuts.unregisterByTargetId(all)
    }

    if (item.sendAllyShortcut) {
      const registration = keyboardShortcuts.getRegistrationByTargetId(ally)

      if (!registration || (registration && registration.shortcutId !== item.sendAllyShortcut)) {
        if (registration) {
          keyboardShortcuts.unregisterByTargetId(ally)
        }

        try {
          keyboardShortcuts.register(ally, item.sendAllyShortcut, 'last-active', () => {
            this._sendExecutor.performSendableItemSend(item.id, 'ally')
          })
        } catch (error) {
          logger.error(`Add shortcut ${ally} failed`, error)
          item.sendAllyShortcut = null
          mutated = true
        }
      }
    } else {
      keyboardShortcuts.unregisterByTargetId(ally)
    }

    if (item.sendEnemyShortcut) {
      const registration = keyboardShortcuts.getRegistrationByTargetId(enemy)

      if (!registration || (registration && registration.shortcutId !== item.sendEnemyShortcut)) {
        if (registration) {
          keyboardShortcuts.unregisterByTargetId(enemy)
        }

        try {
          keyboardShortcuts.register(enemy, item.sendEnemyShortcut, 'last-active', () => {
            this._sendExecutor.performSendableItemSend(item.id, 'enemy')
          })
        } catch (error) {
          logger.error(`Add shortcut ${enemy} failed`, error)
          item.sendEnemyShortcut = null
          mutated = true
        }
      }
    } else {
      keyboardShortcuts.unregisterByTargetId(enemy)
    }

    return [item, mutated] as const
  }

  private _unregisterSendableItemShortcuts(item: SendableItem) {
    const { keyboardShortcuts } = this._context
    const { all, ally, enemy } = this._getShortcutTargetId(item.id)

    keyboardShortcuts.unregisterByTargetId(all)
    keyboardShortcuts.unregisterByTargetId(ally)
    keyboardShortcuts.unregisterByTargetId(enemy)
  }
}
