import {
  AKARI_NAVIGATION_MAIN_NAMESPACE,
  type AkariNavigationRequest
} from '@shared/shards/akari-navigation'

import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { WindowManagerMain } from '../window-manager'

export function registerNavigationIpc(
  ipc: AkariIpcMain,
  windowManager: WindowManagerMain,
  logger: AkariLogger
) {
  const windows = {
    'main-window': windowManager.mainWindow,
    'secondary-window': windowManager.secondaryWindow
  }

  ipc.onCall(
    AKARI_NAVIGATION_MAIN_NAMESPACE,
    'requestNavigation',
    (_, request: AkariNavigationRequest) => {
      const target = windows[request.window]

      if (!target?.window || target.window.isDestroyed()) {
        logger.warn(`Navigation target window unavailable: ${request.window} (${request.targetId})`)
        return
      }

      target.showOrRestore()
      ipc.sendEvent(AKARI_NAVIGATION_MAIN_NAMESPACE, 'navigation-requested', request)
    }
  )
}
