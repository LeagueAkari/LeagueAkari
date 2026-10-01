import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { type HttpProxySetting } from '@shared/shards/network'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { NETWORK_MAIN_NAMESPACE, NETWORK_RENDERER_NAMESPACE } from './context'
import { useNetworkStore } from './store'

@Shard(NetworkRenderer.id)
export class NetworkRenderer implements IAkariShardInitDispose {
  static id = NETWORK_RENDERER_NAMESPACE

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {}

  setHttpProxy(setting: HttpProxySetting) {
    return this._settingUtils.set(NETWORK_MAIN_NAMESPACE, 'httpProxy', setting)
  }

  async onInit() {
    await this._piniaMobxUtils.sync(NETWORK_MAIN_NAMESPACE, 'settings', useNetworkStore().settings)
  }
}
