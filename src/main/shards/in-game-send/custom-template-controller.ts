import {
  IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE,
  IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS,
  IN_GAME_SEND_PRESET_TARGETS,
  type InGameSendCustomTemplateItem,
  type InGameSendCustomTemplateItemPatch,
  type InGameSendPresetTarget,
  createDefaultInGameSendPresetTargetShortcuts,
  getInGameSendCustomTemplateShortcutTargetId,
  normalizeInGameSendCustomTemplateItem,
  normalizeInGameSendCustomTemplateItems
} from '@shared/shards/in-game-send'
import { formatError } from '@shared/utils/errors'
import { randomUUID } from 'node:crypto'

import type { InGameSendMainContext } from './context'
import {
  InGameSendCustomTemplateExecutionError,
  type InGameSendCustomTemplateExecutor
} from './custom-template-executor'
import type { InGameSendExecutor } from './send-executor'

export class InGameSendCustomTemplateController {
  private readonly _shortcutTargetIds = new Set<string>()

  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _customTemplateExecutor: InGameSendCustomTemplateExecutor,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  start() {
    const { mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => settings.customTemplateItems,
      () => this._syncShortcuts(),
      {
        fireImmediately: true
      }
    )
  }

  markRiskNoticeShown() {
    return this._context.settingService.set('customTemplateRiskNoticeShown', true)
  }

  async createItem() {
    const currentItems = this._context.settings.customTemplateItems
    if (currentItems.length >= IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS) {
      throw new Error('Custom template item limit reached')
    }

    const item: InGameSendCustomTemplateItem = {
      id: randomUUID(),
      title: '',
      code: IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE,
      targetShortcuts: createDefaultInGameSendPresetTargetShortcuts()
    }

    await this._setItems([...currentItems, item])
    return item
  }

  async updateItem(id: string, patch: InGameSendCustomTemplateItemPatch) {
    const currentItems = this._context.settings.customTemplateItems
    const itemIndex = currentItems.findIndex((item) => item.id === id)
    if (itemIndex === -1) {
      throw new Error('Custom template item not found')
    }

    const currentItem = currentItems[itemIndex]
    const nextItem = normalizeInGameSendCustomTemplateItem({
      ...currentItem,
      ...patch,
      id,
      targetShortcuts: {
        ...currentItem.targetShortcuts,
        ...(patch.targetShortcuts ?? {})
      }
    })
    const nextItems = [...currentItems]
    nextItems[itemIndex] = nextItem

    await this._setItems(nextItems)

    if (patch.code !== undefined && nextItem.code !== currentItem.code) {
      this._context.state.clearCustomTemplateLastError(id)
    }

    return nextItem
  }

  async deleteItem(id: string) {
    const currentItems = this._context.settings.customTemplateItems
    const nextItems = currentItems.filter((item) => item.id !== id)
    if (nextItems.length === currentItems.length) {
      return false
    }

    await this._setItems(nextItems)
    this._context.state.clearCustomTemplateLastError(id)
    return true
  }

  async reorderItem(id: string, targetIndex: number) {
    const currentItems = this._context.settings.customTemplateItems
    const itemIndex = currentItems.findIndex((item) => item.id === id)
    if (
      itemIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= currentItems.length ||
      targetIndex === itemIndex
    ) {
      return false
    }

    const nextItems = [...currentItems]
    const [movedItem] = nextItems.splice(itemIndex, 1)
    nextItems.splice(targetIndex, 0, movedItem)
    await this._setItems(nextItems)
    return true
  }

  generateLines(id: string, target: InGameSendPresetTarget) {
    const item = this._findItem(id)
    try {
      const lines = this._customTemplateExecutor.execute(item, target)
      this._context.state.clearCustomTemplateLastError(id)
      return lines
    } catch (error) {
      const executionError =
        error instanceof InGameSendCustomTemplateExecutionError
          ? error
          : new InGameSendCustomTemplateExecutionError('execute', 'Template execution failed', {
              cause: error
            })

      this._context.state.setCustomTemplateLastError(id, {
        stage: executionError.stage,
        target,
        occurredAt: Date.now(),
        error: formatError(executionError)
      })
      throw executionError
    }
  }

  send(id: string, target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateLines(id, target))
  }

  private _findItem(id: string) {
    const item = this._context.settings.customTemplateItems.find((item) => item.id === id)
    if (!item) {
      throw new Error('Custom template item not found')
    }
    return item
  }

  private _setItems(items: InGameSendCustomTemplateItem[]) {
    return this._context.settingService.set(
      'customTemplateItems',
      normalizeInGameSendCustomTemplateItems(items)
    )
  }

  private _syncShortcuts() {
    const { keyboardShortcuts, settings } = this._context
    const nextTargetIds = new Set<string>()

    for (const item of settings.customTemplateItems) {
      for (const target of IN_GAME_SEND_PRESET_TARGETS) {
        nextTargetIds.add(getInGameSendCustomTemplateShortcutTargetId(item.id, target))
      }
    }

    for (const targetId of this._shortcutTargetIds) {
      if (!nextTargetIds.has(targetId)) {
        keyboardShortcuts.unregisterByTargetId(targetId)
      }
    }

    this._shortcutTargetIds.clear()

    for (const item of settings.customTemplateItems) {
      for (const target of IN_GAME_SEND_PRESET_TARGETS) {
        this._syncShortcut(item, target)
      }
    }
  }

  private _syncShortcut(item: InGameSendCustomTemplateItem, target: InGameSendPresetTarget) {
    const { keyboardShortcuts, logger } = this._context
    const targetId = getInGameSendCustomTemplateShortcutTargetId(item.id, target)
    const shortcut = item.targetShortcuts[target]

    this._shortcutTargetIds.add(targetId)

    if (!shortcut) {
      keyboardShortcuts.unregisterByTargetId(targetId)
      return
    }

    try {
      keyboardShortcuts.register(targetId, shortcut, 'last-active', () => {
        void this.send(item.id, target).catch((error) => {
          logger.warn('Custom template shortcut execution failed', item.id, target, error)
        })
      })
    } catch (error) {
      logger.warn('Failed to register custom template shortcut', targetId, error)
      void this.updateItem(item.id, {
        targetShortcuts: {
          [target]: null
        }
      }).catch((updateError) => {
        logger.error('Failed to clear custom template shortcut', targetId, updateError)
      })
    }
  }
}
