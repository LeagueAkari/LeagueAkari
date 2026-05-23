import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AppThemeSetting } from '@shared/types/app-theme'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { APP_COMMON_RENDERER_NAMESPACE, MAIN_SHARD_NAMESPACE } from './context'
import { watchAppLocale } from './locale-watcher'
import { syncAppCommonRendererState } from './settings-sync'
import { HttpProxySetting } from './store'

@Shard(AppCommonRenderer.id)
export class AppCommonRenderer implements IAkariShardInitDispose {
  static id = APP_COMMON_RENDERER_NAMESPACE

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._setupInAppScope.addSetupFn(() => watchAppLocale())
  }

  onSecondInstance(fn: (commandLine: string[], workingDirectory: string) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'second-instance', fn)
  }

  getVersion() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getVersion') as Promise<string>
  }

  openUserDataDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openUserDataDir')
  }

  setInKyokoMode(s: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'isInKyokoMode', s)
  }

  setShowFreeSoftwareDeclaration(s: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'showFreeSoftwareDeclaration', s)
  }

  setDisableHardwareAcceleration(s: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setDisableHardwareAcceleration', s)
  }

  setLocale(s: string) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'locale', s)
  }

  setTheme(s: AppThemeSetting) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'theme', s)
  }

  setHttpProxy(s: HttpProxySetting | null) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'httpProxy', s)
  }

  setStreamerMode(s: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'streamerMode', s)
  }

  setStreamerModeUseAkariStyledName(s: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'streamerModeUseAkariStyledName', s)
  }

  setPreferredLolSource(s: 'sgp' | 'lcu') {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'preferredLolSource', s)
  }

  readClipboardText() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'readClipboardText') as Promise<string>
  }

  onApplicationMenuAboutClick(fn: () => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'show-about-akari', fn)
  }

  onApplicationMenuSettingsClick(fn: () => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'show-settings', fn)
  }

  async onInit() {
    await syncAppCommonRendererState(this._piniaMobxUtils, this._settingUtils, () =>
      this.getVersion()
    )
  }

  getRuntimeInfo() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getRuntimeInfo') as Promise<any>
  }

  exit() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'exit')
  }

  onRendererLink(fn: (url: string) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'renderer-link', fn)
  }

  relaunchAsAdministrator() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'relaunchAsAdministrator')
  }

  async onDispose() {}
}
