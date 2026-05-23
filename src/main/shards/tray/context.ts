import type { AppCommonMain } from '../app-common'
import type { AkariIpcMain } from '../ipc'
import type { MobxUtilsMain } from '../mobx-utils'
import type { WindowManagerMain } from '../window-manager'

export const TRAY_MAIN_NAMESPACE = 'tray-main'

export interface TrayMainContext {
  namespace: string
  appCommon: AppCommonMain
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  windowManager: WindowManagerMain
}
