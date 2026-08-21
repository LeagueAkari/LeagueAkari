import type { AkariIpcMain } from '../ipc'
import type { WindowManagerMain } from '../window-manager'

export const MAIN_WINDOW_UI_MAIN_NAMESPACE = 'main-window-ui-main'

export interface MainWindowUiMainContext {
  namespace: string
  ipc: AkariIpcMain
  windowManager: WindowManagerMain
}
