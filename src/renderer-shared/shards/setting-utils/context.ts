import type { AkariIpcRenderer } from '../ipc'

export const SETTING_FACTORY_MAIN_NAMESPACE = 'setting-factory-main'
export const SETTING_UTILS_RENDERER_NAMESPACE = 'setting-utils-renderer'

export interface SettingUtilsRendererContext {
  ipc: AkariIpcRenderer
}
