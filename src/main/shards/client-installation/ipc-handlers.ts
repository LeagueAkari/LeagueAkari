import type { ClientInstallationLauncher } from './client-launcher'
import type { ClientInstallationMainContext } from './context'

export class ClientInstallationIpcHandlers {
  constructor(
    private readonly _context: ClientInstallationMainContext,
    private readonly _launcher: ClientInstallationLauncher
  ) {}

  register() {
    this._context.ipc.onCall(this._context.namespace, 'launchTencentTcls', async () => {
      await this._launcher.launchTencentTcls()
    })

    this._context.ipc.onCall(this._context.namespace, 'launchWeGame', async () => {
      await this._launcher.launchWeGame()
    })

    this._context.ipc.onCall(this._context.namespace, 'launchDefaultRiotClient', async () => {
      await this._launcher.launchDefaultRiotClient()
    })

    this._context.ipc.onCall(this._context.namespace, 'launchWeGameLeagueOfLegends', async () => {
      await this._launcher.launchWeGameLeagueOfLegends()
    })
  }
}
