import type {
  InGameSendFixedTextPresetItemMoveDirection,
  InGameSendFixedTextPresetItemPatch,
  InGameSendJunglePresetOptionPatch,
  InGameSendJunglePresetOptions,
  InGameSendPremadePresetOptionPatch,
  InGameSendPremadePresetOptions,
  InGameSendPresetTarget,
  InGameSendRatingPresetOptionPatch,
  InGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'

import { IN_GAME_SEND_MAIN_NAMESPACE, type InGameSendMainContext } from './context'
import type { InGameSendPresetController } from './preset-controller'
import type { InGameSendPresetSelectionController } from './preset-selection-controller'
import type { InGameSendExecutor } from './send-executor'

/**
 * 暴露给渲染进程的 IPC 调用，用于发送生成后的预设文本和反向写入预设玩家选定状态。
 *
 * 预设选定状态读取走 propSync（ratingPuuids / junglePuuids / premadeIndices
 * 直接在 renderer 的 store 上同步）；生成后的预设文本走 IPC 调用返回。
 */
export class InGameSendIpcHandlers {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _sendExecutor: InGameSendExecutor,
    private readonly _presetController: InGameSendPresetController,
    private readonly _presetSelectionController: InGameSendPresetSelectionController
  ) {}

  register() {
    const { ipc } = this._context

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'setRatingPuuids', (_, puuids: string[]) => {
      this._presetSelectionController.setRatingPuuids(puuids)
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'sendLines', (_, lines: string[]) => {
      return this._sendExecutor.sendLines(lines)
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'generateRatingPresetLines',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.generateRatingLines(target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'generateJunglePresetLines',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.generateJungleLines(target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'generatePremadePresetLines',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.generatePremadeLines(target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'sendRatingPreset',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.sendRatingPreset(target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'sendJunglePreset',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.sendJunglePreset(target)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'sendPremadePreset',
      (_, target: InGameSendPresetTarget) => {
        return this._presetController.sendPremadePreset(target)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'sendFixedTextPreset', (_, id: string) => {
      return this._presetController.sendFixedTextPreset(id)
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setRatingPresetOptions',
      (_, options: InGameSendRatingPresetOptions) => {
        return this._presetController.setRatingPresetOptions(options)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setJunglePresetOptions',
      (_, options: InGameSendJunglePresetOptions) => {
        return this._presetController.setJunglePresetOptions(options)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setPremadePresetOptions',
      (_, options: InGameSendPremadePresetOptions) => {
        return this._presetController.setPremadePresetOptions(options)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updateRatingPresetOptions',
      (_, options: InGameSendRatingPresetOptionPatch) => {
        return this._presetController.updateRatingPresetOptions(options)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updateJunglePresetOptions',
      (_, options: InGameSendJunglePresetOptionPatch) => {
        return this._presetController.updateJunglePresetOptions(options)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updatePremadePresetOptions',
      (_, options: InGameSendPremadePresetOptionPatch) => {
        return this._presetController.updatePremadePresetOptions(options)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'createFixedTextPresetItem', () => {
      return this._presetController.createFixedTextPresetItem()
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'updateFixedTextPresetItem',
      (_, id: string, patch: InGameSendFixedTextPresetItemPatch) => {
        return this._presetController.updateFixedTextPresetItem(id, patch)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'deleteFixedTextPresetItem', (_, id: string) => {
      return this._presetController.deleteFixedTextPresetItem(id)
    })

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'moveFixedTextPresetItem',
      (_, id: string, direction: InGameSendFixedTextPresetItemMoveDirection) => {
        return this._presetController.moveFixedTextPresetItem(id, direction)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'setJunglePuuids', (_, puuids: string[]) => {
      this._presetSelectionController.setJunglePuuids(puuids)
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'setPremadeIndices', (_, indices: number[]) => {
      this._presetSelectionController.setPremadeIndices(indices)
    })

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'clearPresetSelections', () => {
      this._presetSelectionController.clearPresetSelections()
    })
  }
}
