import type { AutoMiscMainContext } from './context'

export class AutoMiscLoginAutomationController {
  constructor(private readonly _context: AutoMiscMainContext) {}

  watch() {
    const { leagueClient, mobxUtils } = this._context

    mobxUtils.reaction(
      () => leagueClient.state.connectionState,
      (connectionState) => {
        if (connectionState !== 'connected') {
          return
        }

        void this._applyLoginAutomations()
      },
      { fireImmediately: true }
    )
  }

  private async _applyLoginAutomations() {
    await this._applyStatusMessageOnLogin()
    await this._applyRankedStatusOnLogin()
  }

  private async _applyStatusMessageOnLogin() {
    const { settings } = this._context

    if (!settings.autoSetStatusMessageEnabled || !settings.statusMessage) {
      return
    }

    // The concrete LCU operation is intentionally left for the watcher implementation pass.
  }

  private async _applyRankedStatusOnLogin() {
    const { settings } = this._context

    if (!settings.autoSetRankedStatusEnabled) {
      return
    }

    // The concrete LCU operation is intentionally left for the watcher implementation pass.
  }
}
