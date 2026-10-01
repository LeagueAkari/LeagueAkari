import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import {
  SELF_UPDATE_MAIN_NAMESPACE,
  SELF_UPDATE_RENDERER_NAMESPACE,
  type SelfUpdateRendererContext
} from './context'
import { watchLastUpdateSucceeded } from './last-update-notification'
import { syncSelfUpdateState } from './state-sync'

@Shard(SelfUpdateRenderer.id)
export class SelfUpdateRenderer implements IAkariShardInitDispose {
  static id = SELF_UPDATE_RENDERER_NAMESPACE

  private readonly _context: SelfUpdateRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = { ipc, piniaMobxUtils, settingUtils, setupInAppScope }
  }

  checkUpdates() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'checkUpdates')
  }

  startUpdate() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'startUpdate')
  }

  forceStartUpdate() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'forceStartUpdate')
  }

  cancelUpdate() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'cancelUpdate')
  }

  openNewUpdatesDir() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'openNewUpdatesDir')
  }

  setAutoDownloadUpdates(enabled: boolean) {
    return this._context.settingUtils.set(
      SELF_UPDATE_MAIN_NAMESPACE,
      'autoDownloadUpdates',
      enabled
    )
  }

  setAutoCheckUpdates(enabled: boolean) {
    return this._context.settingUtils.set(SELF_UPDATE_MAIN_NAMESPACE, 'autoCheckUpdates', enabled)
  }

  setIgnoreVersion(version: string | null) {
    return this._context.settingUtils.set(SELF_UPDATE_MAIN_NAMESPACE, 'ignoreVersion', version)
  }

  uninstallApp() {
    return this._context.ipc.call(SELF_UPDATE_MAIN_NAMESPACE, 'uninstallApp')
  }

  async onInit() {
    await syncSelfUpdateState(this._context)
    this._context.setupInAppScope.addSetupFn(watchLastUpdateSucceeded)
  }
}
