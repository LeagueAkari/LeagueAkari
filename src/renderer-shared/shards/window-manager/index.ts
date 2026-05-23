import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  MAIN_SHARD_NAMESPACE,
  WINDOW_MANAGER_RENDERER_NAMESPACE,
  type WindowManagerRendererContext
} from './context'
import { useWindowManagerStore } from './store'
import {
  AkariAuxWindow,
  AkariCdTimerWindow,
  AkariMainWindow,
  AkariOngoingGameWindow,
  AkariOpggWindow
} from './windows'

export {
  AkariCdTimerWindow,
  AkariOngoingGameWindow,
  AkariOpggWindow,
  type WindowManagerRendererContext
}

@Shard(WindowManagerRenderer.id)
export class WindowManagerRenderer implements IAkariShardInitDispose {
  static id = WINDOW_MANAGER_RENDERER_NAMESPACE

  private context: WindowManagerRendererContext

  public mainWindow: AkariMainWindow
  public auxWindow: AkariAuxWindow
  public opggWindow: AkariOpggWindow
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
    this.auxWindow = new AkariAuxWindow(this.context)
    this.opggWindow = new AkariOpggWindow(this.context)
    this.ongoingGameWindow = new AkariOngoingGameWindow(this.context)
    this.cdTimerWindow = new AkariCdTimerWindow(this.context)
  }

  async onInit() {
    const store = useWindowManagerStore()
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

    await this.mainWindow.onInit()
    await this.auxWindow.onInit()
    await this.opggWindow.onInit()
    await this.ongoingGameWindow.onInit()
    await this.cdTimerWindow.onInit()
  }

  setBackgroundMaterial(value: string) {
    return this.context.setting.set(MAIN_SHARD_NAMESPACE, 'backgroundMaterial', value)
  }

  setContentProtection(value: boolean) {
    return this.context.setting.set(MAIN_SHARD_NAMESPACE, 'contentProtection', value)
  }
}
