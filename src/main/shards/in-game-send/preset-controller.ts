import {
  IN_GAME_SEND_PRESET_TARGETS,
  type InGameSendPresetId,
  type InGameSendPresetOptionPatch,
  type InGameSendPresetOptions,
  type InGameSendPresetOptionsPatch,
  type InGameSendPresetTarget,
  getInGameSendPresetShortcutTargetId,
  mergeInGameSendPresetOptions,
  normalizeInGameSendPresetOptions
} from '@shared/types/shards/in-game-send'

import type { InGameSendMainContext } from './context'
import { buildInGameSendPresetLines } from './presets'
import type { InGameSendPresetContext } from './presets'
import type { InGameSendExecutor } from './send-executor'

const IN_GAME_SEND_PRESET_IDS = [
  'rating',
  'jungle',
  'premade'
] as const satisfies readonly InGameSendPresetId[]

export class InGameSendPresetController {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  start() {
    const { mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => settings.presetOptions,
      () => {
        this._syncPresetShortcuts()
      },
      { fireImmediately: true }
    )
  }

  generateLines(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return buildInGameSendPresetLines(presetId, this._createPresetContext(target))
  }

  sendPreset(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateLines(presetId, target))
  }

  setPresetOptions(options: InGameSendPresetOptions) {
    return this._context.settingService.set(
      'presetOptions',
      normalizeInGameSendPresetOptions(options)
    )
  }

  updatePresetOptions<P extends InGameSendPresetId>(
    presetId: P,
    options: InGameSendPresetOptionPatch<P>
  ) {
    const patch = {
      [presetId]: options
    } as InGameSendPresetOptionsPatch

    return this.setPresetOptions(
      mergeInGameSendPresetOptions(this._context.settings.presetOptions, patch)
    )
  }

  private _syncPresetShortcuts() {
    const { keyboardShortcuts, logger, settings } = this._context

    for (const presetId of IN_GAME_SEND_PRESET_IDS) {
      for (const target of IN_GAME_SEND_PRESET_TARGETS) {
        const targetId = getInGameSendPresetShortcutTargetId(presetId, target)
        const shortcut = settings.presetOptions[presetId].targetShortcuts[target]

        if (!shortcut) {
          keyboardShortcuts.unregisterByTargetId(targetId)
          continue
        }

        try {
          keyboardShortcuts.register(targetId, shortcut, 'last-active', () => {
            void this.sendPreset(presetId, target)
          })
        } catch (error) {
          logger.warn('Failed to register in-game-send preset shortcut', presetId, target, error)
          void this.updatePresetOptions(presetId, {
            targetShortcuts: {
              [target]: null
            }
          })
        }
      }
    }
  }

  private _createPresetContext(target: InGameSendPresetTarget): InGameSendPresetContext {
    return {
      target,
      presetOptions: this._context.settings.presetOptions,
      mainContext: this._context
    }
  }
}
