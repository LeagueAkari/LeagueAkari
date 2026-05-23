import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const GAME_CLIENT_MAIN_NAMESPACE = 'game-client-main'
export const GAME_CLIENT_RENDERER_NAMESPACE = 'game-client-renderer'

export interface GameClientRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
