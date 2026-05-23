import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const WINDOW_MANAGER_RENDERER_NAMESPACE = 'window-manager-renderer'
export const MAIN_SHARD_NAMESPACE = 'window-manager-main'
export const MAIN_SHARD_NAMESPACE_MAIN_WINDOW = 'window-manager-main/main-window'
export const MAIN_SHARD_NAMESPACE_AUX_WINDOW = 'window-manager-main/aux-window'
export const MAIN_SHARD_NAMESPACE_OPGG_WINDOW = 'window-manager-main/opgg-window'
export const MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW = 'window-manager-main/ongoing-game-window'
export const MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW = 'window-manager-main/cd-timer-window'

export interface WindowManagerRendererContext {
  ipc: AkariIpcRenderer
  setting: SettingUtilsRenderer
  pm: PiniaMobxUtilsRenderer
}
