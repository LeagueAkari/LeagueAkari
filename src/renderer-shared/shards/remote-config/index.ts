import { Dep, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useRemoteConfigStore } from './store'

const MAIN_SHARD_NAMESPACE = 'remote-config-main'

@Shard(RemoteConfigRenderer.id)
export class RemoteConfigRenderer {
  static readonly id = 'remote-config-renderer'

  constructor(@Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer) {}

  async onInit() {
    const store = useRemoteConfigStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }
}
