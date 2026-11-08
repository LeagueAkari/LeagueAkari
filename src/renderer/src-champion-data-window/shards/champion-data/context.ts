import type { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import type { ChampionRunesConfig } from '@shared/shards/auto-champ-config'
import type { ChampionDataSourceId } from '@shared/types/champion-data'

export const CHAMPION_DATA_MAIN_NAMESPACE = 'champion-data-main'
export const CHAMPION_DATA_OPGG_NAMESPACE = `${CHAMPION_DATA_MAIN_NAMESPACE}/opgg`
export const CHAMPION_DATA_QQ101_NAMESPACE = `${CHAMPION_DATA_MAIN_NAMESPACE}/qq101`
export const CHAMPION_DATA_RENDERER_NAMESPACE = 'champion-data-renderer'

export interface ChampionDataRendererContext {
  logger: LoggerRenderer
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
}

export interface RuneTask {
  cycle: number
  source: ChampionDataSourceId
  queryKey: string
  runes: ChampionRunesConfig
}

export type RuneAutomationStatus =
  | 'idle'
  | 'disabled'
  | 'waitingChampion'
  | 'waitingLock'
  | 'loading'
  | 'missingPosition'
  | 'unsupportedMode'
  | 'sourceUnavailable'
  | 'preset'
  | 'paused'
  | 'disconnected'
  | 'inGame'
  | 'applied'
  | 'manual'
  | 'applying'
  | 'loadError'
  | 'applyError'
  | 'empty'
