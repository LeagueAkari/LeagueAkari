import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const AUTO_REPLY_MAIN_NAMESPACE = 'auto-reply-main'
export const AUTO_REPLY_RENDERER_NAMESPACE = 'auto-reply-renderer'

export interface AutoReplyRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
