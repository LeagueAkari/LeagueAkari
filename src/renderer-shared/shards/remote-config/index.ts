import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  REMOTE_CONFIG_MAIN_NAMESPACE,
  REMOTE_CONFIG_RENDERER_NAMESPACE,
  type RemoteConfigRendererContext
} from './context'
import { syncRemoteConfigState } from './state-sync'

@Shard(RemoteConfigRenderer.id)
export class RemoteConfigRenderer {
  static readonly id = REMOTE_CONFIG_RENDERER_NAMESPACE

  private readonly _context: RemoteConfigRendererContext

  constructor(
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer,
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer
  ) {
    this._context = {
      ipc,
      piniaMobxUtils,
      settingUtils
    }
  }

  async onInit() {
    await syncRemoteConfigState(this._context)
  }

  setPreferredSource(source: 'gitee' | 'github') {
    return this._context.settingUtils.set(REMOTE_CONFIG_MAIN_NAMESPACE, 'preferredSource', source)
  }

  setUpdateLatestRelease(updateLatestRelease: boolean) {
    return this._context.settingUtils.set(
      REMOTE_CONFIG_MAIN_NAMESPACE,
      'updateLatestRelease',
      updateLatestRelease
    )
  }

  async testRepoLatency(): Promise<{ githubLatency: number; giteeLatency: number }> {
    return await this._context.ipc.call(REMOTE_CONFIG_MAIN_NAMESPACE, 'testRepoLatency')
  }
}
