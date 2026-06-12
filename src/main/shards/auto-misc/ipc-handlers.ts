import type { AutoMiscRankedStatus } from '@shared/types/shards/auto-misc'

import type { AutoMiscMainContext } from './context'
import type { AutoMiscLoginAutomationController } from './login-automation-controller'

export class AutoMiscIpcHandlers {
  constructor(
    private readonly _context: AutoMiscMainContext,
    private readonly _loginAutomationController: AutoMiscLoginAutomationController
  ) {}

  register() {
    const { ipc, namespace } = this._context

    ipc.onCall(namespace, 'applyStatusMessage', async (_, message?: string) => {
      await this._loginAutomationController.applyStatusMessage(message)
    })

    ipc.onCall(namespace, 'applyRankedStatus', async (_, rankedStatus?: AutoMiscRankedStatus) => {
      await this._loginAutomationController.applyRankedStatus(rankedStatus)
    })
  }
}
