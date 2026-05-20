import { i18next } from '@main/i18n'
import { comparer, computed } from 'mobx'

import type { AutoSelectActions } from './actions'
import type { AutoSelectMainContext } from './context'
import type { AutoSelectLocalMessageService } from './local-message-service'

export class AutoSelectBanPickController {
  constructor(
    private readonly _context: AutoSelectMainContext,
    private readonly _localMessage: AutoSelectLocalMessageService,
    private readonly _actions: AutoSelectActions
  ) {}

  watch() {
    this._watchBan()
    this._watchPick()
  }

  private _watchBan() {
    const { logger, mobxUtils, state } = this._context

    const banContext = computed(
      () => {
        const banConfig = state.activeGroupConfig
        const expected = state.expectedBans

        if (!banConfig || !expected) {
          return null
        }

        if (!banConfig.ban.enabled || banConfig.temporarilyDisabled) {
          return null
        }

        // 非 ban 环节，或者没有 activeAction，则不生效
        if ((state.move !== 'complete-ban' && state.move !== 'show-ban') || !state.activeAction) {
          return null
        }

        const expectedBan = expected.find((champion) => champion.status === 'bannable')

        if (!expectedBan) {
          return null
        }

        return {
          move: state.move,
          activeAction: state.activeAction,
          expectedBan,
          delayMs: Math.min(
            banConfig.ban.delaySeconds * 1e3,
            state.correctedTimer?.remainingMs ?? Infinity
          ),
          strategy: banConfig.ban.strategy
        } as const
      },
      { equals: comparer.shallow }
    )

    // --- ban ---
    mobxUtils.reaction(
      () => banContext.get(),
      (context) => {
        if (!context) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (state.delayedBanTask) {
            clearTimeout(state.delayedBanTask.timerId)
            state.setDelayedBan(null)
          }

          return
        }

        const { move, activeAction, expectedBan, delayMs, strategy } = context

        // just-show 逻辑相对特殊，将 complete-ban 视为完成阶段
        // 一旦已经选择了英雄（无论是否是预期），都会立即视为完成，并不再进行任何操作
        if (move === 'complete-ban') {
          if (strategy === 'just-show' && activeAction.championId) {
            if (state.delayedBanTask) {
              clearTimeout(state.delayedBanTask.timerId)
              state.setDelayedBan(null)

              if (activeAction.championId !== expectedBan.id) {
                logger.info(
                  `Already banned ${this._actions.championNameWithId(activeAction.championId)}, didn't change it, move=${move}`
                )
              }

              return
            }
          }
        }

        // 额外的处理：在立即锁定策略下，可能会有极为短暂的切换到 complete-ban 的过渡态，可以直接忽略
        // 这是因为 champ-select session 需要从 *空选* 到 *亮出* 到 *锁定* 三种状态的依次切换
        if (
          strategy === 'lock-in-immediately' &&
          move === 'complete-ban' &&
          state.delayedBanTask?.championId === expectedBan.id
        ) {
          return
        }

        const completed =
          strategy === 'lock-in-immediately' ||
          (strategy === 'show-and-lock-in' && move === 'complete-ban')

        if (state.delayedBanTask) {
          clearTimeout(state.delayedBanTask.timerId)
        }

        if (
          !state.delayedBanTask ||
          state.delayedBanTask.championId !== expectedBan.id ||
          state.delayedBanTask.completed !== completed
        ) {
          this._localMessage.send(
            completed
              ? i18next.t('auto-select-main.complete-ban', {
                  seconds: (delayMs / 1e3).toFixed(1),
                  champion: this._actions.championNameWithId(expectedBan.id)
                })
              : i18next.t('auto-select-main.show-ban', {
                  seconds: (delayMs / 1e3).toFixed(1),
                  champion: this._actions.championNameWithId(expectedBan.id)
                })
          )

          logger.info(
            `Delayed ban champion=${this._actions.championNameWithId(expectedBan.id)} completed=${completed} move=${move} strategy=${strategy} delayedMs=${delayMs}`
          )
        }

        state.setDelayedBan({
          isPickIntent: false,
          completed,
          championId: expectedBan.id,
          delayMs,
          startAt: state.delayedBan?.startAt ?? Date.now(),
          finishAt: Date.now() + delayMs,
          timerId: setTimeout(
            () =>
              this._actions
                .ban(expectedBan.id, activeAction.id, completed)
                .finally(() => state.setDelayedBan(null)),
            delayMs
          )
        })
      }
    )
  }

  private _watchPick() {
    const { logger, mobxUtils, state } = this._context

    const pickContext = computed(
      () => {
        const pickConfig = state.activeGroupConfig
        const expected = state.expectedPicks

        if (!pickConfig || !expected) {
          return null
        }

        if (!pickConfig.pick.enabled || pickConfig.temporarilyDisabled) {
          return
        }

        // 非 pick 环节，或者没有 activeAction，则不生效
        if (
          (state.move !== 'pick-intent' &&
            state.move !== 'complete-pick' &&
            state.move !== 'complete-subset-pick' &&
            state.move !== 'show-pick' &&
            state.move !== 'show-subset-pick') ||
          !state.activeAction
        ) {
          return null
        }

        if (
          state.move === 'pick-intent' &&
          (!state.firstUnfinishedPickAction || !pickConfig.pick.showIntent)
        ) {
          return null
        }

        const expectedPick = expected.find(
          (champion) =>
            champion.status === 'pickable' ||
            champion.status === 'subset-pickable' ||
            (pickConfig.pick.ignoreIntent && champion.status === 'pick-intented')
        )

        if (!expectedPick) {
          return null
        }

        return {
          move: state.move,
          firstUnfinishedPickAction: state.firstUnfinishedPickAction,
          activeAction: state.activeAction,
          expectedPick,
          delayMs: Math.min(
            pickConfig.pick.delaySeconds * 1e3,
            state.correctedTimer?.remainingMs ?? Infinity
          ),
          strategy: pickConfig.pick.strategy
        } as const
      },
      { equals: comparer.shallow }
    )

    // --- pick ---
    mobxUtils.reaction(
      () => pickContext.get(),
      (context) => {
        if (!context) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (state.delayedPickTask) {
            clearTimeout(state.delayedPickTask.timerId)
            state.setDelayedPick(null)
          }

          return
        }

        const { move, firstUnfinishedPickAction, activeAction, expectedPick, delayMs, strategy } =
          context

        if (move === 'complete-pick') {
          // 同 ban 逻辑
          if (strategy === 'just-show' && activeAction.championId) {
            if (state.delayedPickTask) {
              clearTimeout(state.delayedPickTask.timerId)
              state.setDelayedPick(null)
            }

            if (activeAction.championId !== expectedPick.id) {
              logger.info(
                `Already picked ${this._actions.championNameWithId(activeAction.championId)}, didn't change it, move=${move}`
              )
            }

            return
          }
        } else if (move === 'pick-intent') {
          // 不存在可预选的 action / 已经预选了英雄
          if (!firstUnfinishedPickAction || firstUnfinishedPickAction.championId) {
            if (state.delayedPickTask) {
              clearTimeout(state.delayedPickTask.timerId)
              state.setDelayedPick(null)
            }

            return
          }
        }

        // 同 ban 逻辑。忽略短暂中间态
        if (
          strategy === 'lock-in-immediately' &&
          move === 'complete-pick' &&
          state.delayedPickTask?.championId === expectedPick.id
        ) {
          return
        }

        const completed =
          move !== 'pick-intent' &&
          (move === 'show-subset-pick' || // subset pick should complete immediately
            move === 'complete-subset-pick' ||
            strategy === 'lock-in-immediately' ||
            (strategy === 'show-and-lock-in' && move === 'complete-pick'))

        if (state.delayedPickTask) {
          clearTimeout(state.delayedPickTask.timerId)
        }

        if (
          !state.delayedPickTask ||
          state.delayedPickTask.championId !== expectedPick.id ||
          state.delayedPickTask.completed !== completed
        ) {
          if (move === 'pick-intent') {
            this._localMessage.send(
              i18next.t('auto-select-main.intent-pick', {
                seconds: (delayMs / 1e3).toFixed(1),
                champion: this._actions.championNameWithId(expectedPick.id)
              })
            )

            logger.info(
              `Delayed pick intent champion=${this._actions.championNameWithId(expectedPick.id)} completed=${completed} move=${move} strategy=${strategy} delayedMs=${delayMs}`
            )
          } else {
            this._localMessage.send(
              completed
                ? i18next.t('auto-select-main.complete-pick', {
                    seconds: (delayMs / 1e3).toFixed(1),
                    champion: this._actions.championNameWithId(expectedPick.id)
                  })
                : i18next.t('auto-select-main.show-pick', {
                    seconds: (delayMs / 1e3).toFixed(1),
                    champion: this._actions.championNameWithId(expectedPick.id)
                  })
            )

            logger.info(
              `Delayed pick champion=${this._actions.championNameWithId(expectedPick.id)} completed=${completed} move=${move} strategy=${strategy} delayedMs=${delayMs}`
            )
          }
        }

        if (move === 'pick-intent') {
          if (!firstUnfinishedPickAction) {
            state.setDelayedPick(null)
            return
          }

          state.setDelayedPick({
            isPickIntent: true,
            completed: false,
            championId: expectedPick.id,
            delayMs: delayMs,
            startAt: state.delayedPick?.startAt ?? Date.now(),
            finishAt: Date.now() + delayMs,
            timerId: setTimeout(
              () =>
                this._actions
                  .intent(expectedPick.id, firstUnfinishedPickAction.id)
                  .finally(() => state.setDelayedPick(null)),
              delayMs
            )
          })
        } else {
          state.setDelayedPick({
            isPickIntent: false,
            completed,
            championId: expectedPick.id,
            delayMs: delayMs,
            startAt: state.delayedPick?.startAt ?? Date.now(),
            finishAt: Date.now() + delayMs,
            timerId: setTimeout(
              () =>
                this._actions
                  .pick(expectedPick.id, activeAction.id, completed)
                  .finally(() => state.setDelayedPick(null)),
              delayMs
            )
          })
        }
      }
    )
  }
}
