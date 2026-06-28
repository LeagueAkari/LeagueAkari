import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import {
  type InGameSendFixedTextPresetItem,
  type InGameSendFixedTextPresetItemMoveDirection,
  type InGameSendFixedTextPresetItemPatch,
  type InGameSendJunglePresetOptionPatch,
  type InGameSendJunglePresetOptions,
  type InGameSendPremadePresetOptionPatch,
  type InGameSendPremadePresetOptions,
  type InGameSendPresetTarget,
  type InGameSendRatingPresetOptionPatch,
  type InGameSendRatingPresetOptions,
  getInGameSendFixedTextPresetShortcutTargetId,
  getInGameSendJunglePresetShortcutTargetId,
  getInGameSendPremadePresetShortcutTargetId,
  getInGameSendRatingPresetShortcutTargetId
} from '@shared/shards/in-game-send'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  IN_GAME_SEND_MAIN_NAMESPACE,
  IN_GAME_SEND_RENDERER_NAMESPACE,
  type InGameSendRendererContext
} from './context'
import { syncInGameSendSettings, syncInGameSendState } from './settings-sync'

const MAIN_SHARD_NAMESPACE = IN_GAME_SEND_MAIN_NAMESPACE

@Shard(InGameSendRenderer.id)
export class InGameSendRenderer implements IAkariShardInitDispose {
  static id = IN_GAME_SEND_RENDERER_NAMESPACE

  static CANCEL_SHORTCUT_TARGET_ID = `${IN_GAME_SEND_MAIN_NAMESPACE}/cancel`

  static getRatingPresetShortcutTargetId(target: InGameSendPresetTarget) {
    return getInGameSendRatingPresetShortcutTargetId(target)
  }

  static getJunglePresetShortcutTargetId(target: InGameSendPresetTarget) {
    return getInGameSendJunglePresetShortcutTargetId(target)
  }

  static getPremadePresetShortcutTargetId(target: InGameSendPresetTarget) {
    return getInGameSendPremadePresetShortcutTargetId(target)
  }

  static getFixedTextPresetShortcutTargetId(id: string) {
    return getInGameSendFixedTextPresetShortcutTargetId(id)
  }

  private readonly _context: InGameSendRendererContext

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc: this._ipc,
      piniaMobxUtils,
      settingUtils: _settingUtils
    }
  }

  async onInit() {
    await syncInGameSendSettings(this._context)
    await syncInGameSendState(this._context)
  }

  setCancelShortcut(shortcut: string | null) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'cancelShortcut', shortcut)
  }

  setSendInterval(interval: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'sendInterval', interval)
  }

  sendLines(lines: string[]) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendLines', lines)
  }

  generateRatingPresetLines(target: InGameSendPresetTarget) {
    return this._ipc.call<string[]>(MAIN_SHARD_NAMESPACE, 'generateRatingPresetLines', target)
  }

  generateJunglePresetLines(target: InGameSendPresetTarget) {
    return this._ipc.call<string[]>(MAIN_SHARD_NAMESPACE, 'generateJunglePresetLines', target)
  }

  generatePremadePresetLines(target: InGameSendPresetTarget) {
    return this._ipc.call<string[]>(MAIN_SHARD_NAMESPACE, 'generatePremadePresetLines', target)
  }

  sendRatingPreset(target: InGameSendPresetTarget) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendRatingPreset', target)
  }

  sendJunglePreset(target: InGameSendPresetTarget) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendJunglePreset', target)
  }

  sendPremadePreset(target: InGameSendPresetTarget) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendPremadePreset', target)
  }

  sendFixedTextPreset(id: string) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendFixedTextPreset', id)
  }

  updateRatingPresetOptions(options: InGameSendRatingPresetOptionPatch) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateRatingPresetOptions', options)
  }

  updateJunglePresetOptions(options: InGameSendJunglePresetOptionPatch) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateJunglePresetOptions', options)
  }

  updatePremadePresetOptions(options: InGameSendPremadePresetOptionPatch) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updatePremadePresetOptions', options)
  }

  setRatingPresetOptions(options: InGameSendRatingPresetOptions) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setRatingPresetOptions', options)
  }

  setJunglePresetOptions(options: InGameSendJunglePresetOptions) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setJunglePresetOptions', options)
  }

  setPremadePresetOptions(options: InGameSendPremadePresetOptions) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setPremadePresetOptions', options)
  }

  createFixedTextPresetItem() {
    return this._ipc.call<InGameSendFixedTextPresetItem>(
      MAIN_SHARD_NAMESPACE,
      'createFixedTextPresetItem'
    )
  }

  updateFixedTextPresetItem(id: string, patch: InGameSendFixedTextPresetItemPatch) {
    return this._ipc.call<InGameSendFixedTextPresetItem>(
      MAIN_SHARD_NAMESPACE,
      'updateFixedTextPresetItem',
      id,
      patch
    )
  }

  deleteFixedTextPresetItem(id: string) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'deleteFixedTextPresetItem', id)
  }

  moveFixedTextPresetItem(id: string, direction: InGameSendFixedTextPresetItemMoveDirection) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'moveFixedTextPresetItem', id, direction)
  }

  setRatingPuuids(puuids: string[]) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setRatingPuuids', puuids)
  }

  setJunglePuuids(puuids: string[]) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setJunglePuuids', puuids)
  }

  setPremadeIndices(indices: number[]) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setPremadeIndices', indices)
  }

  clearPresetSelections() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'clearPresetSelections')
  }
}
