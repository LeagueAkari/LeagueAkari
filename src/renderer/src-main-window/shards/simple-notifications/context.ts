import type { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import type { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import type { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import type { RemoteConfigRenderer } from '@renderer-shared/shards/remote-config'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import type { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'

export const SIMPLE_NOTIFICATIONS_RENDERER_ID = 'simple-notifications-renderer'

export const NEVER_SHOW_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY =
  'neverShowLiveStreamingStreamerMode'
export const LAST_DISMISS_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY =
  'lastDismissLiveStreamingStreamerMode'

export interface SimpleNotificationsRendererContext {
  clientInstallation: ClientInstallationRenderer
  appCommon: AppCommonRenderer
  settingUtils: SettingUtilsRenderer
  leagueClient: LeagueClientRenderer
  setupInAppScope: SetupInAppScopeRenderer
  leagueClientUx: LeagueClientUxRenderer
  remoteConfig: RemoteConfigRenderer
  ipc: AkariIpcRenderer
}
