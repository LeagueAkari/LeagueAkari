import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const REMOTE_CONFIG_MAIN_NAMESPACE = 'remote-config-main'
export const REMOTE_CONFIG_RENDERER_NAMESPACE = 'remote-config-renderer'

export interface RemoteConfigRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
