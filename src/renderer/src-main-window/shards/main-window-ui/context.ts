import type { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import type { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import type { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

export const MAIN_WINDOW_UI_RENDERER_NAMESPACE = 'main-window-ui-renderer'
export const MAIN_WINDOW_UI_MAIN_NAMESPACE = 'main-window-ui-main'

export interface MainWindowUiRendererContext {
  namespace: string
  ipc: AkariIpcRenderer
  settingUtils: SettingUtilsRenderer
  leagueClient: LeagueClientRenderer
  logger: LoggerRenderer
  setupInAppScope: SetupInAppScopeRenderer
  windowManager: WindowManagerRenderer
}
