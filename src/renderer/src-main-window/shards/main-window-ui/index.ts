import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { watchAutoRouteWhenGameStarts } from './auto-route-watcher'
import {
  MainWindowBackgroundController,
  type MainWindowBackgroundMode
} from './background-controller'
import { MAIN_WINDOW_UI_RENDERER_NAMESPACE, type MainWindowUiRendererContext } from './context'
import { syncMainWindowUiSettings } from './settings-sync'

export type { MainWindowBackgroundMode } from './background-controller'

@Shard(MainWindowUiRenderer.id)
export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = MAIN_WINDOW_UI_RENDERER_NAMESPACE

  private readonly _context: MainWindowUiRendererContext
  private readonly _backgroundController: MainWindowBackgroundController

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer,
    @Dep(WindowManagerRenderer) private readonly _windowManager: WindowManagerRenderer
  ) {
    this._context = {
      namespace: MainWindowUiRenderer.id,
      ipc: this._ipc,
      settingUtils: this._settingUtils,
      leagueClient: this._leagueClient,
      logger: this._logger,
      setupInAppScope: this._setupInAppScope,
      windowManager: this._windowManager
    }
    this._backgroundController = new MainWindowBackgroundController(this._context)
  }

  async onInit() {
    await syncMainWindowUiSettings(this._context)
    this._setupInAppScope.addSetupFn(() => {
      this._backgroundController.setup()
      watchAutoRouteWhenGameStarts()
    })
  }

  async onDispose() {}

  useBackgroundPresentation() {
    return this._backgroundController.usePresentation()
  }

  useBackgroundMode() {
    return this._backgroundController.useMode()
  }

  setBackgroundMode(mode: MainWindowBackgroundMode) {
    return this._backgroundController.setMode(mode)
  }

  useCustomBackgroundSettings() {
    return this._backgroundController.useCustomBackgroundSettings()
  }

  selectCustomBackgroundFile() {
    return this._backgroundController.selectCustomBackgroundFile()
  }

  setCustomBackgroundOverlayStrength(strength: number) {
    return this._backgroundController.setCustomBackgroundOverlayStrength(strength)
  }

  reportBackgroundMediaLoadFailure(url: string) {
    return this._backgroundController.reportBackgroundMediaLoadFailure(url)
  }
}
