import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import type { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'

export const MAIN_WINDOW_UI_RENDERER_NAMESPACE = 'main-window-ui-renderer'

export interface MainWindowUiRendererContext {
  namespace: string
  settingUtils: SettingUtilsRenderer
  leagueClient: LeagueClientRenderer
  logger: LoggerRenderer
  setupInAppScope: SetupInAppScopeRenderer
}
