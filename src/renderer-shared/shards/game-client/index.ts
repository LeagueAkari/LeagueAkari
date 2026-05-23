import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LaunchSpectatorConfig } from '@shared/types/shards/game-client'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  GAME_CLIENT_MAIN_NAMESPACE,
  GAME_CLIENT_RENDERER_NAMESPACE,
  type GameClientRendererContext
} from './context'
import { syncGameClientSettings } from './settings-sync'

@Shard(GameClientRenderer.id)
export class GameClientRenderer implements IAkariShardInitDispose {
  static id = GAME_CLIENT_RENDERER_NAMESPACE

  static SHORTCUT_ID_TERMINATE_GAME_CLIENT = `${GAME_CLIENT_MAIN_NAMESPACE}/terminate-game-client`

  private readonly _context: GameClientRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc,
      piniaMobxUtils,
      settingUtils
    }
  }

  async onInit() {
    await syncGameClientSettings(this._context)
  }

  launchSpectator(config: LaunchSpectatorConfig) {
    return this._context.ipc.call(GAME_CLIENT_MAIN_NAMESPACE, 'launchSpectator', config)
  }

  setTerminateGameClientWithShortcut(value: boolean) {
    return this._context.settingUtils.set(
      GAME_CLIENT_MAIN_NAMESPACE,
      'terminateGameClientWithShortcut',
      value
    )
  }

  setTerminateShortcut(shortcut: string | null) {
    return this._context.settingUtils.set(GAME_CLIENT_MAIN_NAMESPACE, 'terminateShortcut', shortcut)
  }

  setSettingsFileReadonlyOrWritable(mode: 'readonly' | 'writable') {
    return this._context.ipc.call(
      GAME_CLIENT_MAIN_NAMESPACE,
      'setSettingsFileReadonlyOrWritable',
      mode
    )
  }

  getSettingsFileReadonlyOrWritable() {
    return this._context.ipc.call(GAME_CLIENT_MAIN_NAMESPACE, 'getSettingsFileReadonlyOrWritable')
  }
}
