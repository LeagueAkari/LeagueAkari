import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { STORAGE_RENDERER_NAMESPACE, type StorageRendererContext } from './context'
import { syncStorageState } from './state-sync'

@Shard(StorageRenderer.id)
export class StorageRenderer implements IAkariShardInitDispose {
  static id = STORAGE_RENDERER_NAMESPACE

  private readonly _context: StorageRendererContext

  constructor(@Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer) {
    this._context = { piniaMobxUtils }
  }

  async onInit() {
    await syncStorageState(this._context)
  }

  async onDispose() {}
}
