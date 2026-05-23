import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  AUTO_REPLY_MAIN_NAMESPACE,
  AUTO_REPLY_RENDERER_NAMESPACE,
  type AutoReplyRendererContext
} from './context'
import { syncAutoReplySettings } from './settings-sync'

@Shard(AutoReplyRenderer.id)
export class AutoReplyRenderer implements IAkariShardInitDispose {
  static id = AUTO_REPLY_RENDERER_NAMESPACE

  private readonly _context: AutoReplyRendererContext

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

  setEnabled(enabled: boolean) {
    return this._context.settingUtils.set(AUTO_REPLY_MAIN_NAMESPACE, 'enabled', enabled)
  }

  setText(text: string) {
    return this._context.settingUtils.set(AUTO_REPLY_MAIN_NAMESPACE, 'text', text)
  }

  setEnableOnAway(enabled: boolean) {
    return this._context.settingUtils.set(AUTO_REPLY_MAIN_NAMESPACE, 'enableOnAway', enabled)
  }

  setLockOfflineStatus(enabled: boolean) {
    return this._context.settingUtils.set(AUTO_REPLY_MAIN_NAMESPACE, 'lockOfflineStatus', enabled)
  }

  async onInit() {
    await syncAutoReplySettings(this._context)
  }
}
