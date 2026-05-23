import type { AkariIpcRenderer } from '../ipc'

export const PINIA_MOBX_UTILS_MAIN_NAMESPACE = 'mobx-utils-main'
export const PINIA_MOBX_UTILS_RENDERER_NAMESPACE = 'pinia-mobx-utils-renderer'

export interface PiniaMobxUtilsRendererContext {
  ipc: AkariIpcRenderer
}
