import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const AKARI_API_MAIN_NAMESPACE = 'akari-api-main'
export const AKARI_API_RENDERER_NAMESPACE = 'akari-api-renderer'

export interface AkariApiRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
