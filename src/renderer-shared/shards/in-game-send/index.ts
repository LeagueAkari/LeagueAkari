import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import {
  type InGameSendJunglePresetOptions,
  type InGameSendPremadePresetOptions,
  type InGameSendPresetId,
  type InGameSendPresetOptionPatch,
  type InGameSendPresetOptions,
  type InGameSendPresetTarget,
  type InGameSendRatingPresetOptions,
  getInGameSendPresetShortcutTargetId
} from '@shared/types/shards/in-game-send'

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
    return getInGameSendPresetShortcutTargetId('rating', target)
  }

  static getJunglePresetShortcutTargetId(target: InGameSendPresetTarget) {
    return getInGameSendPresetShortcutTargetId('jungle', target)
  }

  static getPremadePresetShortcutTargetId(target: InGameSendPresetTarget) {
    return getInGameSendPresetShortcutTargetId('premade', target)
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

  generatePresetLines(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return this._ipc.call<string[]>(MAIN_SHARD_NAMESPACE, 'generatePresetLines', presetId, target)
  }

  generateRatingPresetLines(target: InGameSendPresetTarget) {
    return this.generatePresetLines('rating', target)
  }

  generateJunglePresetLines(target: InGameSendPresetTarget) {
    return this.generatePresetLines('jungle', target)
  }

  generatePremadePresetLines(target: InGameSendPresetTarget) {
    return this.generatePresetLines('premade', target)
  }

  sendPreset(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendPreset', presetId, target)
  }

  sendRatingPreset(target: InGameSendPresetTarget) {
    return this.sendPreset('rating', target)
  }

  sendJunglePreset(target: InGameSendPresetTarget) {
    return this.sendPreset('jungle', target)
  }

  sendPremadePreset(target: InGameSendPresetTarget) {
    return this.sendPreset('premade', target)
  }

  setPresetOptions(options: InGameSendPresetOptions) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setPresetOptions', options)
  }

  updatePresetOptions<P extends InGameSendPresetId>(
    presetId: P,
    options: InGameSendPresetOptionPatch<P>
  ) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updatePresetOptions', presetId, options)
  }

  updateRatingPresetOptions(options: InGameSendPresetOptionPatch<'rating'>) {
    return this.updatePresetOptions('rating', options)
  }

  updateJunglePresetOptions(options: InGameSendPresetOptionPatch<'jungle'>) {
    return this.updatePresetOptions('jungle', options)
  }

  updatePremadePresetOptions(options: InGameSendPresetOptionPatch<'premade'>) {
    return this.updatePresetOptions('premade', options)
  }

  setRatingPresetOptions(options: InGameSendRatingPresetOptions) {
    return this.updateRatingPresetOptions(options)
  }

  setJunglePresetOptions(options: InGameSendJunglePresetOptions) {
    return this.updateJunglePresetOptions(options)
  }

  setPremadePresetOptions(options: InGameSendPremadePresetOptions) {
    return this.updatePremadePresetOptions(options)
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
