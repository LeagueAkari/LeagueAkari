import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { BanChampionConfig, PickChampionConfig } from '@shared/shards/auto-select'
import { DeepPartialObject } from '@shared/utils/types'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  AUTO_SELECT_MAIN_NAMESPACE,
  AUTO_SELECT_RENDERER_NAMESPACE,
  type AutoSelectRendererContext
} from './context'
import { syncAutoSelectState } from './state-sync'

@Shard(AutoSelectRenderer.id)
export class AutoSelectRenderer implements IAkariShardInitDispose {
  static id = AUTO_SELECT_RENDERER_NAMESPACE

  private readonly _context: AutoSelectRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc,
      piniaMobxUtils,
      settingUtils
    }
  }

  setPickConfig(groupId: string, config: DeepPartialObject<PickChampionConfig>) {
    return this._context.ipc.call(AUTO_SELECT_MAIN_NAMESPACE, 'setPickConfig', groupId, config)
  }

  setBanConfig(groupId: string, config: DeepPartialObject<BanChampionConfig>) {
    return this._context.ipc.call(AUTO_SELECT_MAIN_NAMESPACE, 'setBanConfig', groupId, config)
  }

  setTemporarilyDisabled(temporarilyDisabled: boolean) {
    return this._context.ipc.call(
      AUTO_SELECT_MAIN_NAMESPACE,
      'setTemporarilyDisabled',
      temporarilyDisabled
    )
  }

  async onInit() {
    await syncAutoSelectState(this._context)
  }
}
