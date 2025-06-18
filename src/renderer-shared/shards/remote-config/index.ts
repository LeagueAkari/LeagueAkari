import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useRemoteConfigStore } from './store'

const MAIN_SHARD_NAMESPACE = 'remote-config-main'

@Shard(RemoteConfigRenderer.id)
export class RemoteConfigRenderer {
  static readonly id = 'remote-config-renderer'

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer
  ) {}

  async onInit() {
    const store = useRemoteConfigStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  setPreferredSource(source: 'gitee' | 'github') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'preferredSource', source)
  }

  async testLatency(): Promise<{ githubLatency: number; giteeLatency: number }> {
    return await this._ipc.call(MAIN_SHARD_NAMESPACE, 'testLatency')
  }
}
