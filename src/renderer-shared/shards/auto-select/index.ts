import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { DeepPartialObject } from '@shared/utils/types'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { BanChampionConfig, PickChampionConfig, useAutoSelectStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-select-main'

@Shard(AutoSelectRenderer.id)
export class AutoSelectRenderer implements IAkariShardInitDispose {
  static id = 'auto-select-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  setPickConfig(groupId: string, config: DeepPartialObject<PickChampionConfig>) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setPickConfig', groupId, config)
  }

  setBanConfig(groupId: string, config: DeepPartialObject<BanChampionConfig>) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setBanConfig', groupId, config)
  }

  setTemporaryDisabled(temporaryDisabled: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setTemporaryDisabled', temporaryDisabled)
  }

  async onInit() {
    const store = useAutoSelectStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
