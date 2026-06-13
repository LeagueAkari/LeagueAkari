import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { InGameSendPresetId, InGameSendPresetTarget } from '@shared/types/shards/in-game-send'

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

  sendPreset(presetId: InGameSendPresetId, target: InGameSendPresetTarget) {
    return this._ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'sendPreset', presetId, target)
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
