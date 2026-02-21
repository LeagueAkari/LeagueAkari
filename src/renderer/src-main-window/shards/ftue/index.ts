import { useInstance } from '@renderer-shared/shards'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { h } from 'vue'

import FtueModal from '@main-window/components/FtueModal.vue'

import { useFtueStore } from './store'

@Shard(FtueRenderer.id)
export class FtueRenderer implements IAkariShardInitDispose {
  static id = 'ftue-renderer'

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {}

  async onInit() {
    const store = useFtueStore()

    await this._setting.savedPropVue(FtueRenderer.id, store, 'completed', {
      watchOptions: { deep: true }
    })

    if (import.meta.env.DEV) {
      console.info('[FTUE] loaded completed', Object.keys(store.completed || {}))
    }

    this._setupInAppScope.addRenderVNode(() => h(FtueModal))
  }

  async onDispose() {}
}

export function useFtue() {
  return useInstance(FtueRenderer)
}
