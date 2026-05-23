import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerMain } from '../window-manager'
import { TRAY_MAIN_NAMESPACE, type TrayMainContext } from './context'
import { TrayMenuController } from './tray-menu-controller'
import { TrayStateWatcher } from './tray-state-watcher'

/**
 * 有关托盘区那里的逻辑
 */
@Shard(TrayMain.id)
export class TrayMain implements IAkariShardInitDispose {
  static id = TRAY_MAIN_NAMESPACE

  private readonly _context: TrayMainContext
  private readonly _menuController: TrayMenuController
  private readonly _stateWatcher: TrayStateWatcher

  constructor(
    private readonly _windowManager: WindowManagerMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _appCommon: AppCommonMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._context = {
      namespace: TrayMain.id,
      appCommon: this._appCommon,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      windowManager: this._windowManager
    }
    this._menuController = new TrayMenuController(this._context)
    this._stateWatcher = new TrayStateWatcher(this._context, this._menuController)
  }

  async onInit() {
    this._menuController.build()
    this._stateWatcher.watch()
  }

  async onDispose() {
    this._menuController.destroy()
  }
}
