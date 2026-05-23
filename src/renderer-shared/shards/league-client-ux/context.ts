import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const LEAGUE_CLIENT_UX_MAIN_NAMESPACE = 'league-client-ux-main'
export const LEAGUE_CLIENT_UX_RENDERER_NAMESPACE = 'league-client-ux-renderer'

export interface LeagueClientUxRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
