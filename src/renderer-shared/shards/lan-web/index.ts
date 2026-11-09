import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LAN_WEB_MAIN_NAMESPACE, LAN_WEB_RENDERER_NAMESPACE } from '@shared/shards/lan-web'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import type { LanWebRendererContext } from './context'
import { syncLanWebState } from './state-sync'

@Shard(LanWebRenderer.id)
export class LanWebRenderer implements IAkariShardInitDispose {
  static id = LAN_WEB_RENDERER_NAMESPACE
  private readonly _context: LanWebRendererContext

  constructor(
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = { piniaMobxUtils, settingUtils }
  }

  async onInit() {
    await syncLanWebState(this._context)
  }

  setEnabled(value: boolean) {
    return this._context.settingUtils.set(LAN_WEB_MAIN_NAMESPACE, 'enabled', value)
  }

  setPort(value: number) {
    return this._context.settingUtils.set(LAN_WEB_MAIN_NAMESPACE, 'port', value)
  }
}
