import {
  IN_GAME_SEND_PRESET_TARGETS,
  type InGameSendJunglePresetOptionPatch,
  type InGameSendJunglePresetOptions,
  type InGameSendPremadePresetOptionPatch,
  type InGameSendPremadePresetOptions,
  type InGameSendPresetTarget,
  type InGameSendPresetTargetShortcuts,
  type InGameSendRatingPresetOptionPatch,
  type InGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'

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
        settings.premadePresetOptions
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

  sendRatingPreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateRatingLines(target))
  }

  sendJunglePreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateJungleLines(target))
  }

  sendPremadePreset(target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generatePremadeLines(target))
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
}
