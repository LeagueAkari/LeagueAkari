import type { AutoMiscRankedStatus } from '@shared/types/shards/auto-misc'

import type { AutoMiscMainContext } from './context'

export class AutoMiscLoginAutomationController {
  constructor(private readonly _context: AutoMiscMainContext) {}

  watch() {
    const { leagueClient, mobxUtils } = this._context

    mobxUtils.reaction(
      () => Boolean(leagueClient.data.summoner.me),
      (isSummonerReady, wasSummonerReady) => {
        if (!isSummonerReady || wasSummonerReady) {
          return
        }

        void this._applyLoginAutomations()
      },
      { fireImmediately: true }
    )
  }

  async applyStatusMessage(message = this._context.settings.statusMessage) {
    await this._context.leagueClient.api.chat.setChatStatusMessage(message)
    this._context.logger.info('Applied chat status message')
  }

  async applyRankedStatus(
    rankedStatus: AutoMiscRankedStatus = this._context.settings.rankedStatus
  ) {
    await this._context.leagueClient.api.chat.changeRanked(
      rankedStatus.queue,
      rankedStatus.tier,
      this._isApexRankedTier(rankedStatus.tier) ? undefined : rankedStatus.division
    )
    this._context.logger.info('Applied ranked status')
  }

  private async _applyLoginAutomations() {
    await Promise.allSettled([this._applyStatusMessageOnLogin(), this._applyRankedStatusOnLogin()])
  }

  private async _applyStatusMessageOnLogin() {
    const { logger, settings } = this._context

    if (!settings.autoSetStatusMessageEnabled) {
      return
    }

    try {
      await this.applyStatusMessage()
    } catch (error) {
      logger.warn('Failed to apply chat status message on summoner ready', error)
    }
  }

  private async _applyRankedStatusOnLogin() {
    const { logger, settings } = this._context

    if (!settings.autoSetRankedStatusEnabled) {
      return
    }

    try {
      await this.applyRankedStatus()
    } catch (error) {
      logger.warn('Failed to apply ranked status on summoner ready', error)
    }
  }

  private _isApexRankedTier(tier: AutoMiscRankedStatus['tier']) {
    return tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER'
  }
}
