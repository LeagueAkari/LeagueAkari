import { i18next } from '@main/i18n'
import { formatError } from '@shared/utils/errors'
import { comparer, computed } from 'mobx'

import type { AutoGameflowMainContext } from './context'

export class AutoGameflowMatchmakingController {
  private _autoSearchMatchTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null

  constructor(private readonly _context: AutoGameflowMainContext) {}

  watch() {
    this._watchAutoMatchmakingEnabled()
    this._watchActivityStartStatus()
    this._watchRematchCancel()
  }

  cancelAutoMatchmaking(reason?: string) {
    const { logger, state } = this._context

    if (state.willSearchMatch) {
      if (this._autoSearchMatchTimerId) {
        clearTimeout(this._autoSearchMatchTimerId)
        this._autoSearchMatchTimerId = null
      }
      if (this._autoSearchMatchCountdownTimerId) {
        this._sendAutoSearchMatchInfoInChat(reason)
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }

      state.clearAutoSearchMatch()
      logger.info(`Auto-matchmaking cancelled - ${reason || 'unknown reason'}`)
    }
  }

  private _watchAutoMatchmakingEnabled() {
    const { mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => settings.autoMatchmakingEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
        }
      },
      { fireImmediately: true }
    )
  }

  private _watchActivityStartStatus() {
    const { logger, mobxUtils, settings, state } = this._context

    mobxUtils.reaction(
      () => [state.activityStartStatus, settings.autoMatchmakingEnabled] as const,
      ([status, enabled]) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
          return
        }

        if (status === 'can-start-activity') {
          logger.info(
            `Now will start matchmaking in ${settings.autoMatchmakingDelaySeconds} seconds`
          )
          state.setSearchMatchAt(Date.now() + settings.autoMatchmakingDelaySeconds * 1e3)
          this._autoSearchMatchTimerId = setTimeout(
            () => this._startMatchmaking(),
            settings.autoMatchmakingDelaySeconds * 1e3
          )

          this._sendAutoSearchMatchInfoInChat()
          this._autoSearchMatchCountdownTimerId = setInterval(
            () => this._sendAutoSearchMatchInfoInChat(),
            1000
          )
        } else if (status === 'unavailable' || status === 'cannot-start-activity') {
          this.cancelAutoMatchmaking('normal')
        } else {
          this.cancelAutoMatchmaking(status)
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  private _watchRematchCancel() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    const simplifiedSearchState = computed(() => {
      if (!leagueClient.data.matchmaking.search) {
        return null
      }

      return {
        timeInQueue: leagueClient.data.matchmaking.search.timeInQueue,
        estimatedQueueTime: leagueClient.data.matchmaking.search.estimatedQueueTime,
        searchState: leagueClient.data.matchmaking.search.searchState,
        lowPriorityData: leagueClient.data.matchmaking.search.lowPriorityData,
        isCurrentlyInQueue: leagueClient.data.matchmaking.search.isCurrentlyInQueue
      }
    })

    let penaltyTime = 0
    mobxUtils.reaction(
      () => Boolean(simplifiedSearchState.get()),
      (hasSearchState) => {
        if (hasSearchState) {
          penaltyTime = simplifiedSearchState.get()?.lowPriorityData.penaltyTime || 0
        } else {
          penaltyTime = 0
        }
      },
      { fireImmediately: true }
    )

    mobxUtils.reaction(
      () =>
        [
          simplifiedSearchState.get(),
          settings.autoMatchmakingRematchStrategy,
          settings.autoMatchmakingRematchFixedDuration
        ] as const,
      ([searchState, strategy, duration]) => {
        if (strategy === 'never' || !searchState || searchState.searchState !== 'Searching') {
          return
        }

        if (!searchState.isCurrentlyInQueue) {
          return
        }

        if (strategy === 'fixed-duration') {
          if (searchState.timeInQueue - penaltyTime >= duration) {
            leagueClient.api.lobby.deleteSearchMatch().catch((error) => {
              logger.warn(`Failed to cancel matchmaking: ${formatError(error)}`)
            })
            return
          }
        } else if (strategy === 'estimated-duration') {
          if (searchState.timeInQueue - penaltyTime >= searchState.estimatedQueueTime) {
            leagueClient.api.lobby.deleteSearchMatch().catch((error) => {
              logger.warn(`Failed to cancel matchmaking: ${formatError(error)}`)
            })
          }
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  private async _startMatchmaking() {
    const { ipc, leagueClient, logger, namespace, state } = this._context

    try {
      if (this._autoSearchMatchCountdownTimerId) {
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }
      state.clearAutoSearchMatch()
      this._autoSearchMatchTimerId = null
      await leagueClient.api.lobby.searchMatch()
    } catch (error) {
      ipc.sendEvent(namespace, 'error-matchmaking', formatError(error))

      logger.warn(`Failed to start matchmaking`, error)
    }
  }

  private async _sendAutoSearchMatchInfoInChat(cancel?: string) {
    const { leagueClient, state } = this._context

    if (leagueClient.data.chat.conversations.customGame && state.willSearchMatch) {
      if (cancel === 'normal') {
        leagueClient.api.chat
          .chatSend(
            leagueClient.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-invitee') {
        leagueClient.api.chat
          .chatSend(
            leagueClient.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-invitees')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'not-the-leader') {
        leagueClient.api.chat
          .chatSend(
            leagueClient.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-not-leader')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-penalty-time') {
        leagueClient.api.chat
          .chatSend(
            leagueClient.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-penalty')}`,
            'celebration'
          )
          .catch(() => {})
        return
      }

      const time = (state.willSearchMatchAt - Date.now()) / 1e3
      leagueClient.api.chat
        .chatSend(
          leagueClient.data.chat.conversations.customGame.id,
          `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-in', { seconds: Math.abs(time).toFixed() })}`,
          'celebration'
        )
        .catch(() => {})
    }
  }
}
