import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const AUTO_CHAMP_CONFIG_MAIN_NAMESPACE = 'auto-champ-config-main'
export const AUTO_CHAMP_CONFIG_RENDERER_NAMESPACE = 'auto-champ-config-renderer'

export interface AutoChampConfigRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
