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

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        logger.info(`Update Entitlements Token: ${JSON.stringify(copiedToken)}`)

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

        const copied = token.slice(0, 24) + '...'
        logger.info(`Update Lol League Session Token: ${copied}`)
        state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }
}
