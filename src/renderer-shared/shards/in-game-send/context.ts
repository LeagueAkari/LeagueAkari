import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const IN_GAME_SEND_MAIN_NAMESPACE = 'in-game-send-main'
export const IN_GAME_SEND_RENDERER_NAMESPACE = 'in-game-send-renderer'

export interface InGameSendRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
