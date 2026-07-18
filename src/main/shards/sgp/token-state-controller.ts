import type { SgpMainContext } from './context'

export class SgpTokenStateController {
  constructor(private readonly context: SgpMainContext) {}

  watch() {
    this._maintainEntitlementsToken()
    this._maintainLeagueSessionToken()
  }

  private _maintainEntitlementsToken() {
    const { leagueClient, logger, mobxUtils, state } = this.context

    mobxUtils.reaction(
      () => leagueClient.data.entitlements.token,
      (token) => {
        if (!token) {
          state.setEntitlementsTokenSet(false)
          return
        }

        logger.info('Update Entitlements Token: <redacted>')

        state.setEntitlementsTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLeagueSessionToken() {
    const { leagueClient, logger, mobxUtils, state } = this.context

    mobxUtils.reaction(
      () => leagueClient.data.leagueSession.token,
      (token) => {
        if (!token) {
          state.setLeagueSessionTokenSet(false)
          return
        }

        logger.info('Update Lol League Session Token: <redacted>')
        state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }
}
