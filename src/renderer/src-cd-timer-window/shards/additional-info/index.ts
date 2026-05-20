import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { useAdditionalInfoStore } from './store'

const OG_MAIN_SHARD_NAMESPACE = 'ongoing-game-main'

@Shard(AdditionalInfoShard.id)
export class AdditionalInfoShard implements IAkariShardInitDispose {
  static id = 'additional-info-renderer'

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {}

  async onInit() {
    const store = useAdditionalInfoStore()

    this._piniaMobxUtils.sync(OG_MAIN_SHARD_NAMESPACE, 'additional', store)
  }
}
