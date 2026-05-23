import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const RESPAWN_TIMER_MAIN_NAMESPACE = 'respawn-timer-main'
export const RESPAWN_TIMER_RENDERER_NAMESPACE = 'respawn-timer-renderer'

export interface RespawnTimerRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
