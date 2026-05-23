import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  RESPAWN_TIMER_MAIN_NAMESPACE,
  RESPAWN_TIMER_RENDERER_NAMESPACE,
  type RespawnTimerRendererContext
} from './context'
import { syncRespawnTimerState } from './state-sync'

@Shard(RespawnTimerRenderer.id)
export class RespawnTimerRenderer implements IAkariShardInitDispose {
  static id = RESPAWN_TIMER_RENDERER_NAMESPACE

  private readonly _context: RespawnTimerRendererContext

  constructor(
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      piniaMobxUtils,
      settingUtils
    }
  }

  async onInit() {
    await syncRespawnTimerState(this._context)
  }

  setEnabled(value: boolean) {
    return this._context.settingUtils.set(RESPAWN_TIMER_MAIN_NAMESPACE, 'enabled', value)
  }
}
