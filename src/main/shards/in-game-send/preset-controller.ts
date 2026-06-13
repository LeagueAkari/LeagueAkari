import type { InGameSendPresetId, InGameSendPresetTarget } from '@shared/types/shards/in-game-send'

import type { InGameSendMainContext } from './context'
import { buildInGameSendPresetLines } from './presets'
import type { InGameSendPresetContext } from './presets'
import type { InGameSendExecutor } from './send-executor'

export class InGameSendPresetController {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendExecutor: InGameSendExecutor
  ) {}

  generateLines(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return buildInGameSendPresetLines(presetId, this._createPresetContext(target))
  }

  sendPreset(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return this._sendExecutor.sendLines(this.generateLines(presetId, target))
  }

  private _createPresetContext(target: InGameSendPresetTarget): InGameSendPresetContext {
    return {
      target,
      mainContext: this._context
    }
  }
}
