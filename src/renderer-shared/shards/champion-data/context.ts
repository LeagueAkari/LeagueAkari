import type { AkariIpcRenderer } from '../ipc'
import type { LoggerRenderer } from '../logger'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const CHAMPION_DATA_MAIN_NAMESPACE = 'champion-data-main'
export const CHAMPION_DATA_OPGG_NAMESPACE = `${CHAMPION_DATA_MAIN_NAMESPACE}/opgg`
export const CHAMPION_DATA_QQ101_NAMESPACE = `${CHAMPION_DATA_MAIN_NAMESPACE}/qq101`
export const CHAMPION_DATA_RENDERER_NAMESPACE = 'champion-data-renderer'

export interface ChampionDataRendererContext {
  logger: LoggerRenderer
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
}

export interface ChampionDataRendererConfig {
  enableFullData?: boolean
}
