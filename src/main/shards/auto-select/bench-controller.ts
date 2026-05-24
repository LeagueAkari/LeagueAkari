import { i18next } from '@main/i18n'
import { comparer, computed, observable } from 'mobx'

import type { AutoSelectActionExecutor } from './action-executor'
import type { AutoSelectMainContext } from './context'
import type { AutoSelectLocalMessageService } from './local-message-service'

export class AutoSelectBenchController {
  constructor(
    private readonly _context: AutoSelectMainContext,
    private readonly _localMessage: AutoSelectLocalMessageService,
    private readonly _actionExecutor: AutoSelectActionExecutor
  ) {}

  watch() {
    const { mobxUtils, state } = this._context

    /** 记录英雄变动的时间现成 */
    const benchChampionCooldown = observable.box<Record<number, number> | null>(null)

    const trackCooldown = (previous: Record<number, number> | null, current: number[]) => {
      const next: Record<number, number> = {}

      current.forEach((championId) => {
        if (!previous || !previous[championId]) {
          next[championId] = Date.now()
        } else {
          next[championId] = previous[championId]
        }
      })

      return next
    }

    // diff
    mobxUtils.reaction(
      () => state.scopedBenchChampions,
      (bench) => {
        if (!bench) {
          benchChampionCooldown.set(null)
          return
        }

        const newCooldown = trackCooldown(benchChampionCooldown.get(), bench)
        benchChampionCooldown.set(newCooldown)
      },
      { equals: comparer.shallow }
    )

    const benchSwapContext = computed(() => {
      const bench = benchChampionCooldown.get()
      if (!bench) {
        return null
      }

      const pickConfig = state.activeGroupConfig
      const expected = state.expectedSwaps

      if (!pickConfig || !expected) {
        return null
      }

      if (
        !pickConfig.pick.enabled ||
        pickConfig.temporarilyDisabled ||
        !state.currentSessionChampionId
      ) {
        return null
      }

      if (state.move !== 'bench-swap' && state.move !== 'subset-bench-swap') {
        return null
      }

      const expectedSwapIndex = expected.findIndex(
        (champion) => champion.status === 'subset-swappable' || champion.status === 'swappable'
      )

      if (expectedSwapIndex === -1) {
        return null
      }

      const currentChampionIndex = expected.findIndex(
        (champion) => champion.id === state.currentSessionChampionId
      )

      // 当手上没有任何合适的英雄，直接锁定第一个预选
      // 对于手上存在合适的英雄，根据情况是否选择更换
      // 如果策略是找到更高优先级的可选英雄，锁定为更高优先级的，否则什么也不做
      if (
        currentChampionIndex === -1 ||
        (pickConfig.pick.benchSelectFirstAvailableChampion &&
          expectedSwapIndex < currentChampionIndex)
      ) {
        const champion = expected[expectedSwapIndex]
        const axis = bench[champion.id]

        if (!axis) {
          return null
        }

        const delayMs = pickConfig.pick.benchSwapAccumulatedDelaySeconds * 1e3 - (Date.now() - axis)

        return {
          expectedSwap: champion,
          delayMs: Math.min(delayMs, state.correctedTimer?.remainingMs ?? Infinity)
        }
      }

      return null
    })

    // --- swap ---
    mobxUtils.reaction(
      () => benchSwapContext.get(),
      (context) => {
        if (!context) {
          if (state.delayedBenchSwapTask) {
            clearTimeout(state.delayedBenchSwapTask.timerId)
            state.setDelayedBenchSwap(null)
          }

          return
        }

        const {
          delayMs,
          expectedSwap: { id }
        } = context

        if (state.delayedBenchSwapTask) {
          clearTimeout(state.delayedBenchSwapTask.timerId)
        }

        if (!state.delayedBenchSwapTask || id !== state.delayedBenchSwapTask.championId) {
          this._localMessage.send(
            i18next.t('auto-select-main.bench-swap', {
              seconds: (delayMs / 1e3).toFixed(1),
              champion: this._actionExecutor.championNameWithId(id)
            })
          )
        }

        state.setDelayedBenchSwap({
          championId: id,
          delayMs,
          finishAt: Date.now() + delayMs,
          startAt: state.delayedBenchSwap?.startAt ?? Date.now(),
          timerId: setTimeout(
            () => this._actionExecutor.benchSwap(id).finally(() => state.setDelayedBenchSwap(null)),
            delayMs
          )
        })
      }
    )
  }
}
