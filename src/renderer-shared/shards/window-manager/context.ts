import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const WINDOW_MANAGER_RENDERER_NAMESPACE = 'window-manager-renderer'
export const WINDOW_MANAGER_MAIN_NAMESPACE = 'window-manager-main'
export const MAIN_WINDOW_MAIN_NAMESPACE = 'window-manager-main/main-window'
export const AUX_WINDOW_MAIN_NAMESPACE = 'window-manager-main/aux-window'
export const CHAMPION_DATA_WINDOW_MAIN_NAMESPACE = 'window-manager-main/champion-data-window'
export const ONGOING_GAME_WINDOW_MAIN_NAMESPACE = 'window-manager-main/ongoing-game-window'
export const CD_TIMER_WINDOW_MAIN_NAMESPACE = 'window-manager-main/cd-timer-window'

export interface WindowManagerRendererContext {
  ipc: AkariIpcRenderer
  setting: SettingUtilsRenderer
  pm: PiniaMobxUtilsRenderer
}
