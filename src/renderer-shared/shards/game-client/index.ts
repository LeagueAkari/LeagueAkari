import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LaunchSpectatorConfig } from '@shared/types/shards/game-client'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useGameClientStore } from './store'

const MAIN_SHARD_NAMESPACE = 'game-client-main'

@Shard(GameClientRenderer.id)
export class GameClientRenderer implements IAkariShardInitDispose {
  static id = 'game-client-renderer'

  static SHORTCUT_ID_TERMINATE_GAME_CLIENT = `${MAIN_SHARD_NAMESPACE}/terminate-game-client`

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  async onInit() {
    const store = useGameClientStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  launchSpectator(config: LaunchSpectatorConfig) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchSpectator', config)
  }

  setTerminateGameClientWithShortcut(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'terminateGameClientWithShortcut', value)
  }

  setTerminateShortcut(shortcut: string | null) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'terminateShortcut', shortcut)
  }

  setSettingsFileReadonlyOrWritable(mode: 'readonly' | 'writable') {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setSettingsFileReadonlyOrWritable', mode)
  }

  getSettingsFileReadonlyOrWritable() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getSettingsFileReadonlyOrWritable')
  }
}
