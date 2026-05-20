import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useStorageStore } from './store'

const MAIN_SHARD_NAMESPACE = 'storage-main'

@Shard(StorageRenderer.id)
export class StorageRenderer implements IAkariShardInitDispose {
  static id = 'storage-renderer'

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {}

  async onInit() {
    const store = useStorageStore()
    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  async onDispose() {}
}
