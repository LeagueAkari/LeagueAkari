import {
  IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS,
  IN_GAME_SEND_PRESET_TARGETS,
  type InGameSendFixedTextPresetItem,
  type InGameSendFixedTextPresetItemMoveDirection,
  type InGameSendFixedTextPresetItemPatch,
  type InGameSendJunglePresetOptionPatch,
  type InGameSendJunglePresetOptions,
  type InGameSendPremadePresetOptionPatch,
  type InGameSendPremadePresetOptions,
  type InGameSendPresetTarget,
  type InGameSendPresetTargetShortcuts,
  type InGameSendRatingPresetOptionPatch,
  type InGameSendRatingPresetOptions,
  getInGameSendFixedTextPresetShortcutTargetId,
  normalizeInGameSendFixedTextPresetItem,
  normalizeInGameSendFixedTextPresetItems
} from '@shared/shards/in-game-send'
import { randomUUID } from 'node:crypto'

import type { InGameSendMainContext } from './context'
import {
  buildJunglePresetLinesFromMainContext,
  buildPremadePresetLinesFromMainContext,
  buildRatingPresetLinesFromMainContext,
  getJunglePresetShortcutTargetId,
  getPremadePresetShortcutTargetId,
  getRatingPresetShortcutTargetId
} from './presets'
import type { InGameSendExecutor } from './send-executor'
import type { InGameSendSettings } from './state'

type InGameSendPresetOptionsSettingKey =
  | 'ratingPresetOptions'
  | 'junglePresetOptions'
  | 'premadePresetOptions'

type InGameSendPresetOptionsValue = InGameSendSettings[InGameSendPresetOptionsSettingKey]

type InGameSendPresetOptionsPatch<TOptions extends InGameSendPresetOptionsValue> = Partial<
  Omit<TOptions, 'targetShortcuts'>
> & {
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
}

export class InGameSendPresetController {
  private readonly _fixedTextShortcutTargetIds = new Set<string>()

  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  start() {
    const { mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => [
        settings.ratingPresetOptions,
        settings.junglePresetOptions,
        settings.premadePresetOptions,
        settings.fixedTextPresetItems
      ],
      () => {
        this._syncPresetShortcuts()
      },
      { fireImmediately: true }
    )
  }

  generateRatingLines(target: InGameSendPresetTarget) {
    return buildRatingPresetLinesFromMainContext(this._context, target)
  }

  generateJungleLines(target: InGameSendPresetTarget) {
    return buildJunglePresetLinesFromMainContext(this._context, target)
  }

  generatePremadeLines(target: InGameSendPresetTarget) {
    return buildPremadePresetLinesFromMainContext(this._context, target)
  }

  generateFixedTextPresetLines(id: string) {
    const item = this._context.settings.fixedTextPresetItems.find((item) => item.id === id)

    if (!item) {
      return []
    }

    return item.content.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)
  }

  sendRatingPreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateRatingLines(target))
  }

  sendJunglePreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateJungleLines(target))
  }

  sendPremadePreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generatePremadeLines(target))
  }

  sendFixedTextPreset(id: string) {
    return this._sendExecutor.sendLines(this.generateFixedTextPresetLines(id))
  }

  setRatingPresetOptions(options: InGameSendRatingPresetOptions) {
    return this._setPresetOptions('ratingPresetOptions', options)
  }

  setJunglePresetOptions(options: InGameSendJunglePresetOptions) {
    return this._setPresetOptions('junglePresetOptions', options)
  }

  setPremadePresetOptions(options: InGameSendPremadePresetOptions) {
    return this._setPresetOptions('premadePresetOptions', options)
  }

  updateRatingPresetOptions(options: InGameSendRatingPresetOptionPatch) {
    return this._updatePresetOptions('ratingPresetOptions', options)
  }

  updateJunglePresetOptions(options: InGameSendJunglePresetOptionPatch) {
    return this._updatePresetOptions('junglePresetOptions', options)
  }

  updatePremadePresetOptions(options: InGameSendPremadePresetOptionPatch) {
    return this._updatePresetOptions('premadePresetOptions', options)
  }

  async createFixedTextPresetItem() {
    const currentItems = this._context.settings.fixedTextPresetItems

    if (currentItems.length >= IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS) {
      throw new Error('Fixed text preset item limit reached')
    }

    const item: InGameSendFixedTextPresetItem = {
      id: randomUUID(),
      title: '',
      shortcut: null,
      content: ''
    }

    await this._setFixedTextPresetItems([...currentItems, item])

    return item
  }

  async updateFixedTextPresetItem(id: string, patch: InGameSendFixedTextPresetItemPatch) {
    const currentItems = this._context.settings.fixedTextPresetItems
    const itemIndex = currentItems.findIndex((item) => item.id === id)

    if (itemIndex === -1) {
      throw new Error('Fixed text preset item not found')
    }

    const nextItems = [...currentItems]
    const nextItem = normalizeInGameSendFixedTextPresetItem({
      ...nextItems[itemIndex],
      ...patch,
      id
    })

    nextItems[itemIndex] = nextItem
    await this._setFixedTextPresetItems(nextItems)

    return nextItem
  }

  async deleteFixedTextPresetItem(id: string) {
    const currentItems = this._context.settings.fixedTextPresetItems
    const nextItems = currentItems.filter((item) => item.id !== id)

    if (nextItems.length === currentItems.length) {
      return false
    }

    await this._setFixedTextPresetItems(nextItems)
    return true
  }

  async moveFixedTextPresetItem(id: string, direction: InGameSendFixedTextPresetItemMoveDirection) {
    const currentItems = this._context.settings.fixedTextPresetItems
    const itemIndex = currentItems.findIndex((item) => item.id === id)

    if (itemIndex === -1) {
      return false
    }

    const nextIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1

    if (nextIndex < 0 || nextIndex >= currentItems.length) {
      return false
    }

    const nextItems = [...currentItems]
    const movedItem = nextItems[itemIndex]
    nextItems[itemIndex] = nextItems[nextIndex]
    nextItems[nextIndex] = movedItem
    await this._setFixedTextPresetItems(nextItems)

    return true
  }

  private _syncPresetShortcuts() {
    const { settings } = this._context

    this._syncTargetShortcuts(
      settings.ratingPresetOptions.targetShortcuts,
      getRatingPresetShortcutTargetId,
      (target) => this.sendRatingPreset(target),
      (target) =>
        this.updateRatingPresetOptions({
          targetShortcuts: {
            [target]: null
          }
        })
    )

    this._syncTargetShortcuts(
      settings.junglePresetOptions.targetShortcuts,
      getJunglePresetShortcutTargetId,
      (target) => this.sendJunglePreset(target),
      (target) =>
        this.updateJunglePresetOptions({
          targetShortcuts: {
            [target]: null
          }
        })
    )

    this._syncTargetShortcuts(
      settings.premadePresetOptions.targetShortcuts,
      getPremadePresetShortcutTargetId,
      (target) => this.sendPremadePreset(target),
      (target) =>
        this.updatePremadePresetOptions({
          targetShortcuts: {
            [target]: null
          }
        })
    )

    this._syncFixedTextShortcuts(settings.fixedTextPresetItems)
  }

  private _syncTargetShortcuts(
    shortcuts: InGameSendPresetTargetShortcuts,
    getTargetId: (target: InGameSendPresetTarget) => string,
    send: (target: InGameSendPresetTarget) => Promise<boolean>,
    clearShortcut: (target: InGameSendPresetTarget) => Promise<void>
  ) {
    const { keyboardShortcuts, logger } = this._context

    for (const target of IN_GAME_SEND_PRESET_TARGETS) {
      const targetId = getTargetId(target)
      const shortcut = shortcuts[target]

      if (!shortcut) {
        keyboardShortcuts.unregisterByTargetId(targetId)
        continue
      }

      try {
        keyboardShortcuts.register(targetId, shortcut, 'last-active', () => {
          void send(target)
        })
      } catch (error) {
        logger.warn('Failed to register in-game-send preset shortcut', targetId, error)
        void clearShortcut(target)
      }
    }
  }

  private _setPresetOptions<Key extends InGameSendPresetOptionsSettingKey>(
    key: Key,
    options: InGameSendSettings[Key]
  ) {
    return this._context.settingService.set(key, options)
  }

  private _updatePresetOptions<Key extends InGameSendPresetOptionsSettingKey>(
    key: Key,
    options: InGameSendPresetOptionsPatch<InGameSendSettings[Key]>
  ) {
    const current = this._context.settings[key]

    return this._setPresetOptions(key, {
      ...current,
      ...options,
      targetShortcuts: {
        ...current.targetShortcuts,
        ...(options.targetShortcuts ?? {})
      }
    } as InGameSendSettings[Key])
  }

  private _syncFixedTextShortcuts(items: InGameSendFixedTextPresetItem[]) {
    const { keyboardShortcuts, logger } = this._context
    const nextTargetIds = new Set<string>()

    for (const item of items) {
      nextTargetIds.add(getInGameSendFixedTextPresetShortcutTargetId(item.id))
    }

    for (const targetId of this._fixedTextShortcutTargetIds) {
      if (!nextTargetIds.has(targetId)) {
        keyboardShortcuts.unregisterByTargetId(targetId)
      }
    }

    this._fixedTextShortcutTargetIds.clear()

    for (const item of items) {
      const targetId = getInGameSendFixedTextPresetShortcutTargetId(item.id)

      this._fixedTextShortcutTargetIds.add(targetId)

      if (!item.shortcut) {
        keyboardShortcuts.unregisterByTargetId(targetId)
        continue
      }

      try {
        keyboardShortcuts.register(targetId, item.shortcut, 'last-active', () => {
          void this.sendFixedTextPreset(item.id)
        })
      } catch (error) {
        logger.warn('Failed to register in-game-send fixed text preset shortcut', targetId, error)
        void this.updateFixedTextPresetItem(item.id, {
          shortcut: null
        })
      }
    }
  }

  private _setFixedTextPresetItems(items: InGameSendFixedTextPresetItem[]) {
    return this._context.settingService.set(
      'fixedTextPresetItems',
      normalizeInGameSendFixedTextPresetItems(items)
    )
  }
}
