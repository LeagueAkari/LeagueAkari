import { app } from 'electron'

import type { AppCommonMainContext } from './context'
import type { AppCommonMain } from './index'

export class AppCommonIpcHandlers {
  constructor(
    private readonly context: AppCommonMainContext,
    private readonly appCommon: AppCommonMain
  ) {}

  register() {
    const { ipc, namespace, shared } = this.context

    ipc.onCall(namespace, 'setDisableHardwareAcceleration', (_, disabled: boolean) => {
      this.appCommon.setDisableHardwareAccelerationAndRelaunch(disabled)
    })

    ipc.onCall(namespace, 'relaunchAsAdministrator', () => {
      return this.appCommon.relaunchAsAdministrator()
    })

    ipc.onCall(namespace, 'getVersion', () => {
      return shared.global.version
    })

    ipc.onCall(namespace, 'openUserDataDir', () => {
      return this.appCommon.openUserDataDir()
    })

    ipc.onCall(namespace, 'readClipboardText', () => {
      return this.appCommon.readClipboardText()
    })

    ipc.onCall(namespace, 'getRuntimeInfo', () => {
      return this.appCommon.getRuntimeInfo()
    })

    ipc.onCall(namespace, 'exit', () => {
      app.exit()
    })
  }
}
