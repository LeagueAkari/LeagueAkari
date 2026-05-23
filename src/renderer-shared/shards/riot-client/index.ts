import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { RIOT_CLIENT_RENDERER_NAMESPACE } from './context'
import { createRiotClientHttpApi } from './http-api'

@Shard(RiotClientRenderer.id)
export class RiotClientRenderer implements IAkariShardInitDispose {
  static id = RIOT_CLIENT_RENDERER_NAMESPACE

  public readonly api = createRiotClientHttpApi()

  async onInit() {}

  constructor(@Dep(PiniaMobxUtilsRenderer) _piniaMobxUtils: PiniaMobxUtilsRenderer) {}
}
