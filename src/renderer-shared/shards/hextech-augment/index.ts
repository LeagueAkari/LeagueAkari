import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useHextechAugmentStore } from './store'

@Shard(HextechAugmentRenderer.id)
export class HextechAugmentRenderer implements IAkariShardInitDispose {
  static id = 'hextech-augment-renderer'
  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {}

  async onInit() {
    const store = useHextechAugmentStore()
    await this._piniaMobxUtils.sync('hextech-augment-main', 'settings', store.settings)
    await this._piniaMobxUtils.sync('hextech-augment-main', 'state', store)
  }

  setEnabled(enabled: boolean) {
    return this._settingUtils.set('hextech-augment-main', 'enabled', enabled)
  }
}
