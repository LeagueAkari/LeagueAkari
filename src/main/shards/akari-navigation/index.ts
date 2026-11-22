import { Shard } from '@shared/akari-shard'
import { AKARI_NAVIGATION_MAIN_NAMESPACE } from '@shared/shards/akari-navigation'

import { AkariIpcMain } from '../ipc'
import { LoggerFactoryMain } from '../logger-factory'
import { WindowManagerMain } from '../window-manager'
import { registerNavigationIpc } from './ipc-handlers'

@Shard(AkariNavigationMain.id)
export class AkariNavigationMain {
  static id = AKARI_NAVIGATION_MAIN_NAMESPACE

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _windowManager: WindowManagerMain,
    private readonly _loggerFactory: LoggerFactoryMain
  ) {}

  onInit() {
    registerNavigationIpc(
      this._ipc,
      this._windowManager,
      this._loggerFactory.create(AkariNavigationMain.id)
    )
  }
}
