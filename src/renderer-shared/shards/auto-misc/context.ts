import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const AUTO_MISC_MAIN_NAMESPACE = 'auto-misc-main'
export const AUTO_MISC_RENDERER_NAMESPACE = 'auto-misc-renderer'

export interface AutoMiscRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
