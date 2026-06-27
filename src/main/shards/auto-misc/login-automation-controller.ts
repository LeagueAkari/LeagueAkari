import { TimeoutTask } from '@main/utils/timer'
import type { AutoMiscRankedStatus } from '@shared/shards/auto-misc'

import type { AutoMiscMainContext } from './context'

const CHAT_ME_SETTLE_DELAY_MS = 2000

interface ApplyOptions {
  automated?: boolean
}

export class AutoMiscLoginAutomationController {
  private readonly _chatMeSettledAutomationTask = new TimeoutTask(
    () => {
      void this._applyChatReadyAutomationsOnce()
    },
    { delay: CHAT_ME_SETTLE_DELAY_MS }
  )

  private _isChatReadyAutomationDone = false

  constructor(private readonly _context: AutoMiscMainContext) {}

  watch() {
    const { leagueClient, mobxUtils } = this._context

    mobxUtils.reaction(
      () => leagueClient.data.chat.me,
      (me) => {
        if (!me) {
          this._resetChatReadyAutomationState()
          return
        }

        if (this._isChatReadyAutomationDone) {
          return
        }

        this._chatMeSettledAutomationTask.start()
      },
      { fireImmediately: true }
    )

    mobxUtils.reaction(
      () => leagueClient.state.isConnected,
      (isConnected) => {
        if (!isConnected) {
          this._resetChatReadyAutomationState()
        }
      }
    )
  }

  async applyStatusMessage(
    message = this._context.settings.statusMessage,
    options: ApplyOptions = {}
  ) {
    if (!options.automated) {
      this._interruptChatReadyAutomation()
    }

    await this._context.leagueClient.api.chat.setChatStatusMessage(message)
    this._context.logger.info('Applied chat status message')
  }

  async applyRankedStatus(
    rankedStatus: AutoMiscRankedStatus = this._context.settings.rankedStatus,
    options: ApplyOptions = {}
  ) {
    if (!options.automated) {
      this._interruptChatReadyAutomation()
    }

    await this._context.leagueClient.api.chat.changeRanked(
      rankedStatus.queue,
      rankedStatus.tier,
      this._isApexRankedTier(rankedStatus.tier) ? undefined : rankedStatus.division
    )
    this._context.logger.info('Applied ranked status')
  }

  private async _applyChatReadyAutomationsOnce() {
    const { leagueClient } = this._context

    if (
      this._isChatReadyAutomationDone ||
      !leagueClient.state.isConnected ||
      !leagueClient.data.chat.me
    ) {
      return
    }

    this._isChatReadyAutomationDone = true
    await this._applyChatReadyAutomations()
  }

  private async _applyChatReadyAutomations() {
    await Promise.allSettled([
      this._applyStatusMessageOnChatReady(),
      this._applyRankedStatusOnChatReady()
    ])
  }

  private async _applyStatusMessageOnChatReady() {
    const { logger, settings } = this._context

    if (!settings.autoSetStatusMessageEnabled) {
      return
    }

    try {
      await this.applyStatusMessage(settings.statusMessage, { automated: true })
    } catch (error) {
      logger.warn('Failed to apply chat status message on chat ready', error)
    }
  }

  private async _applyRankedStatusOnChatReady() {
    const { logger, settings } = this._context

    if (!settings.autoSetRankedStatusEnabled) {
      return
    }

    try {
      await this.applyRankedStatus(settings.rankedStatus, { automated: true })
    } catch (error) {
      logger.warn('Failed to apply ranked status on chat ready', error)
    }
  }

  private _resetChatReadyAutomationState() {
    this._chatMeSettledAutomationTask.cancel()
    this._isChatReadyAutomationDone = false
  }

  private _interruptChatReadyAutomation() {
    this._chatMeSettledAutomationTask.cancel()
    this._isChatReadyAutomationDone = true
  }

  private _isApexRankedTier(tier: AutoMiscRankedStatus['tier']) {
    return tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER'
  }
}
