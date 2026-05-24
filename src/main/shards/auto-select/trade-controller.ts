import { i18next } from '@main/i18n'
import { comparer, computed } from 'mobx'

import type { AutoSelectActionExecutor } from './action-executor'
import type { AutoSelectMainContext } from './context'
import type { AutoSelectLocalMessageService } from './local-message-service'

export class AutoSelectTradeController {
  constructor(
    private readonly _context: AutoSelectMainContext,
    private readonly _localMessage: AutoSelectLocalMessageService,
    private readonly _actionExecutor: AutoSelectActionExecutor
  ) {}

  watch() {
    const { mobxUtils, state } = this._context

    /** 记录其可用的时间，在没有基准的时候手动提供基准 */
    mobxUtils.reaction(
      () => state.ongoingChampionSwap,
      (trade, previousTrade) => {
        // 仅在第一次**收到** trade 时，记录其可用的时间
        if (!previousTrade && trade && trade.state === 'RECEIVED') {
          state.setOngoingChampionSwapCreatedAt(Date.now())
          return
        }

        state.setOngoingChampionSwapCreatedAt(null)
      },
      { fireImmediately: true }
    )

    const championSwapContext = computed(
      () => {
        if (!state.ongoingChampionSwapCreatedAt || !state.myTeamSlotChampions.length) {
          return null
        }

        const pickConfig = state.activeGroupConfig
        const expected = state.expectedSwaps

        if (
          !pickConfig ||
          !pickConfig.pick.benchHandleTradeEnabled ||
          !expected ||
          !state.ongoingChampionSwapCreatedAt
        ) {
          return null
        }

        if (!state.ongoingChampionSwap) {
          return null
        }

        const tradeId = state.ongoingChampionSwap.id
        const herChampionId = state.ongoingChampionSwap.requesterChampionId

        const delayMs =
          pickConfig.pick.delaySeconds * 1e3 - (Date.now() - state.ongoingChampionSwapCreatedAt)

        const timeLeft =
          state.inFinalizationPhase && state.correctedTimer
            ? state.correctedTimer.remainingMs
            : Infinity

        const herIndex = expected.findIndex((champion) => champion.id === herChampionId)

        if (herIndex === -1) {
          return {
            action: 'decline',
            delayMs: Math.min(delayMs, timeLeft),
            requesterChampionId: herChampionId,
            tradeId: tradeId
          }
        }

        const handIndex = expected.findIndex(
          (champion) => champion.id === state.currentSessionChampionId
        )

        if (
          handIndex === -1 ||
          (pickConfig.pick.benchSelectFirstAvailableChampion && herIndex < handIndex)
        ) {
          return {
            action: 'accept',
            delayMs: Math.min(timeLeft, Math.max(0, delayMs)),
            requesterChampionId: herChampionId,
            tradeId: tradeId
          }
        }

        return {
          action: 'decline',
          delayMs: Math.min(timeLeft, Math.max(0, delayMs)),
          requesterChampionId: herChampionId,
          tradeId: tradeId
        }
      },
      { equals: comparer.structural }
    )

    // --- trade: champion swap ---
    mobxUtils.reaction(
      () => championSwapContext.get(),
      (context) => {
        if (!context) {
          if (state.delayedChampionSwapTask) {
            clearTimeout(state.delayedChampionSwapTask.timerId)
            state.setDelayedChampionSwap(null)
          }

          return
        }

        if (state.delayedChampionSwapTask) {
          clearTimeout(state.delayedChampionSwapTask.timerId)
        }

        const { action, delayMs, requesterChampionId, tradeId } = context

        if (
          !state.delayedChampionSwapTask ||
          state.delayedChampionSwapTask.action !== action ||
          state.delayedChampionSwapTask.tradeId !== tradeId ||
          state.delayedChampionSwapTask.requesterChampionId !== requesterChampionId
        ) {
          this._localMessage.send(
            i18next.t(`auto-select-main.${action}-champion-swap`, {
              seconds: (delayMs / 1e3).toFixed(1),
              champion: this._actionExecutor.championNameWithId(requesterChampionId)
            })
          )
        }

        if (action === 'accept') {
          state.setDelayedChampionSwap({
            action,
            tradeId: tradeId,
            delayMs,
            finishAt: Date.now() + delayMs,
            startAt: state.delayedChampionSwap?.startAt ?? Date.now(),
            requesterChampionId: requesterChampionId,
            timerId: setTimeout(
              () =>
                this._actionExecutor
                  .acceptChampionSwap(tradeId)
                  .finally(() => state.setDelayedChampionSwap(null)),
              delayMs
            )
          })
        } else if (action === 'decline') {
          state.setDelayedChampionSwap({
            action,
            tradeId: tradeId,
            delayMs,
            finishAt: Date.now() + delayMs,
            startAt: state.delayedChampionSwap?.startAt ?? Date.now(),
            requesterChampionId: requesterChampionId,
            timerId: setTimeout(
              () =>
                this._actionExecutor
                  .declineChampionSwap(tradeId)
                  .finally(() => state.setDelayedChampionSwap(null)),
              delayMs
            )
          })
        } else {
          state.setDelayedChampionSwap(null)
        }
      },
      { fireImmediately: true }
    )
  }
}
