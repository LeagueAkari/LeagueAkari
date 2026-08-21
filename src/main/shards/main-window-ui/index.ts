import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { WindowManagerMain } from '../window-manager'
import { MAIN_WINDOW_UI_MAIN_NAMESPACE, type MainWindowUiMainContext } from './context'
import { MainWindowUiMainIpcHandlers } from './ipc-handlers'

// 我不确定是否真的应该在 main shard 加入这些东西
// 理论上来说，文件选择器强依赖主进程去处理
// 先这样吧
@Shard(MainWindowUiMain.id)
export class MainWindowUiMain implements IAkariShardInitDispose {
  static id = MAIN_WINDOW_UI_MAIN_NAMESPACE

  private readonly _context: MainWindowUiMainContext
  private readonly _ipcHandlers: MainWindowUiMainIpcHandlers

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _windowManager: WindowManagerMain
  ) {
    this._context = {
      namespace: MainWindowUiMain.id,
      ipc: this._ipc,
      windowManager: this._windowManager
    }
    this._ipcHandlers = new MainWindowUiMainIpcHandlers(this._context)
  }

  async onInit() {
    this._ipcHandlers.register()
  }

  async onDispose() {}
}
