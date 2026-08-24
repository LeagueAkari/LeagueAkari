import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const CHAMPION_DATA_MAIN_NAMESPACE = 'champion-data-main'
export const CHAMPION_DATA_RENDERER_NAMESPACE = 'champion-data-renderer'

export interface ChampionDataRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
}

export interface ChampionDataRendererRequestOptions {
  signal?: AbortSignal
}
