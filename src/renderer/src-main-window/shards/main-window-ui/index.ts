import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { computed } from 'vue'

import { watchAutoRouteWhenGameStarts } from './auto-route-watcher'
import { BackgroundSkinService } from './background-skin-service'
import { MAIN_WINDOW_UI_RENDERER_NAMESPACE, type MainWindowUiRendererContext } from './context'
import { watchProfileSkinBackground } from './profile-background-watcher'
import { syncMainWindowUiSettings } from './settings-sync'
import { useMainWindowUiStore } from './store'

@Shard(MainWindowUiRenderer.id)
export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = MAIN_WINDOW_UI_RENDERER_NAMESPACE

  private readonly _context: MainWindowUiRendererContext
  private readonly _backgroundSkinService: BackgroundSkinService

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = {
      namespace: MainWindowUiRenderer.id,
      settingUtils: this._settingUtils,
      leagueClient: this._leagueClient,
      logger: this._logger,
      setupInAppScope: this._setupInAppScope
    }
    this._backgroundSkinService = new BackgroundSkinService(this._context)
  }

  async onInit() {
    await syncMainWindowUiSettings(this._context)
    this._setupInAppScope.addSetupFn(() => {
      watchProfileSkinBackground(this._backgroundSkinService)
      watchAutoRouteWhenGameStarts()
    })
  }

  async onDispose() {}

  usePreferredBackgroundImageUrl() {
    const store = useMainWindowUiStore()

    const backgroundImageUrl = computed(() => {
      if (store.frontendSettings.useProfileSkinAsBackground) {
        if (store.tabBackgroundSkinUrl) {
          return LeagueClientRenderer.url(store.tabBackgroundSkinUrl)
        }

        if (store.backgroundSkinUrl) {
          return LeagueClientRenderer.url(store.backgroundSkinUrl)
        }
      }

      return null
    })

    return backgroundImageUrl
  }
}
