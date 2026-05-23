import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { EXTRA_ASSETS_RENDERER_NAMESPACE, type ExtraAssetsRendererContext } from './context'
import { syncExtraAssetsState } from './state-sync'

@Shard(ExtraAssetsRenderer.id)
export class ExtraAssetsRenderer implements IAkariShardInitDispose {
  static id = EXTRA_ASSETS_RENDERER_NAMESPACE

  private readonly _context: ExtraAssetsRendererContext

  constructor(@Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer) {
    this._context = {
      piniaMobxUtils
    }
  }

  async onInit() {
    await syncExtraAssetsState(this._context)
  }
}
