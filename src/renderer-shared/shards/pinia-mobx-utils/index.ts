import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PINIA_MOBX_UTILS_RENDERER_NAMESPACE, type PiniaMobxUtilsRendererContext } from './context'
import { PiniaStateSync } from './pinia-state-sync'

export { PINIA_MOBX_UTILS_MAIN_NAMESPACE as MAIN_SHARD_NAMESPACE } from './context'

/**
 * 对应主进程模块, 适用于 Pinia 的状态同步器
 */
@Shard(PiniaMobxUtilsRenderer.id)
export class PiniaMobxUtilsRenderer implements IAkariShardInitDispose {
  static id = PINIA_MOBX_UTILS_RENDERER_NAMESPACE

  private readonly _stateSync: PiniaStateSync

  constructor(@Dep(AkariIpcRenderer) ipc: AkariIpcRenderer) {
    const context: PiniaMobxUtilsRendererContext = { ipc }
    this._stateSync = new PiniaStateSync(context)
  }

  async sync(namespace: string, stateId: string, store: any) {
    await this._stateSync.sync(namespace, stateId, store)
  }

  async onInit() {}

  async onDispose() {}
}
