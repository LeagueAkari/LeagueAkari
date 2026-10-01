import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'
import type { SetupInAppScopeRenderer } from '../setup-in-app-scope'

export const SELF_UPDATE_MAIN_NAMESPACE = 'self-update-main'
export const SELF_UPDATE_RENDERER_NAMESPACE = 'self-update-renderer'

export interface SelfUpdateRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
  setupInAppScope: SetupInAppScopeRenderer
}
