import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { BackgroundMaterialSetting } from '@shared/shards/window-manager'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  WINDOW_MANAGER_MAIN_NAMESPACE,
  WINDOW_MANAGER_RENDERER_NAMESPACE,
  type WindowManagerRendererContext
} from './context'
import { useWindowManagerStore } from './store'
import {
  AkariCdTimerWindow,
  AkariMainWindow,
  AkariOngoingGameWindow,
  AkariSecondaryWindow
} from './windows'

export {
  AkariCdTimerWindow,
  AkariOngoingGameWindow,
  AkariSecondaryWindow,
  type WindowManagerRendererContext
}

@Shard(WindowManagerRenderer.id)
export class WindowManagerRenderer implements IAkariShardInitDispose {
  static id = WINDOW_MANAGER_RENDERER_NAMESPACE

  private context: WindowManagerRendererContext

  public mainWindow: AkariMainWindow
  public secondaryWindow: AkariSecondaryWindow
  public ongoingGameWindow: AkariOngoingGameWindow
  public cdTimerWindow: AkariCdTimerWindow

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(LoggerRenderer) readonly _logger: LoggerRenderer
  ) {
    this.context = {
      setting: this._settingUtils,
      ipc: this._ipc,
      pm: this._piniaMobxUtils
    }

    this.mainWindow = new AkariMainWindow(this.context)
    this.secondaryWindow = new AkariSecondaryWindow(this.context)
    this.ongoingGameWindow = new AkariOngoingGameWindow(this.context)
    this.cdTimerWindow = new AkariCdTimerWindow(this.context)
  }

  async onInit() {
    const store = useWindowManagerStore()
    await this.context.pm.sync(WINDOW_MANAGER_MAIN_NAMESPACE, 'state', store)
    await this.context.pm.sync(WINDOW_MANAGER_MAIN_NAMESPACE, 'settings', store.settings)

    await this.mainWindow.onInit()
    await this.secondaryWindow.onInit()
    await this.ongoingGameWindow.onInit()
    await this.cdTimerWindow.onInit()
  }

  setBackgroundMaterial(value: BackgroundMaterialSetting) {
    return this.context.setting.set(WINDOW_MANAGER_MAIN_NAMESPACE, 'backgroundMaterial', value)
  }

  setContentProtection(value: boolean) {
    return this.context.setting.set(WINDOW_MANAGER_MAIN_NAMESPACE, 'contentProtection', value)
  }
}
