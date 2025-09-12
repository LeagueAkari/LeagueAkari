import { i18next } from '@main/i18n'
import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatError, formatErrorMessage } from '@shared/utils/errors'
import { DeepPartialObject } from '@shared/utils/types'
import _ from 'lodash'
import { comparer, computed, observable, runInAction, toJS } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { GROUPS } from './groups'
import { AutoSelectSettings, AutoSelectState, BanChampionConfig, PickChampionConfig } from './state'

@Shard(AutoSelectMain.id)
export class AutoSelectMain implements IAkariShardInitDispose {
  static id = 'auto-select-main'

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  public readonly settings = new AutoSelectSettings()
  public readonly state: AutoSelectState

  constructor(
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._log = _loggerFactory.create(AutoSelectMain.id)
    this.state = new AutoSelectState(this._lc.data, this.settings)
    this._setting = _settingFactory.register(
      AutoSelectMain.id,
      {
        benchExpectedChampions: { default: this.settings.benchExpectedChampions },
        expectedChampions: { default: this.settings.expectedChampions },
        bannedChampions: { default: this.settings.bannedChampions },
        normalModeEnabled: { default: this.settings.normalModeEnabled },
        pickStrategy: { default: this.settings.pickStrategy },
        selectTeammateIntendedChampion: { default: this.settings.selectTeammateIntendedChampion },
        showIntent: { default: this.settings.showIntent },
        lockInDelaySeconds: { default: this.settings.lockInDelaySeconds },
        benchModeEnabled: { default: this.settings.benchModeEnabled },
        benchSelectFirstAvailableChampion: {
          default: this.settings.benchSelectFirstAvailableChampion
        },
        grabDelaySeconds: { default: this.settings.grabDelaySeconds },
        banDelaySeconds: { default: this.settings.banDelaySeconds },
        banEnabled: { default: this.settings.banEnabled },
        banTeammateIntendedChampion: { default: this.settings.banTeammateIntendedChampion },
        benchHandleTradeEnabled: { default: this.settings.benchHandleTradeEnabled },

        pickConfig: { default: this.settings.pickConfig },
        banConfig: { default: this.settings.banConfig }
      },
      this.settings
    )
  }

  private async _fillAutoBanPickConfig() {
    let modified = false

    runInAction(() => {
      for (const group of GROUPS) {
        if (!this.settings.pickConfig[group.groupId]) {
          modified = true
          this.settings.setPickConfig(group.groupId, this.settings.createNewEmptyPickConfig())
        }

        if (!this.settings.banConfig[group.groupId]) {
          modified = true
          this.settings.setBanConfig(group.groupId, this.settings.createNewEmptyBanConfig())
        }
      }
    })

    if (modified) {
      await this._setting.set('pickConfig', this.settings.pickConfig)
      await this._setting.set('banConfig', this.settings.banConfig)
    }
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoSelectMain.id, 'settings', this.settings, [
      'normalModeEnabled',
      'selectTeammateIntendedChampion',
      'showIntent',
      'pickStrategy',
      'lockInDelaySeconds',
      'benchModeEnabled',
      'benchSelectFirstAvailableChampion',
      'grabDelaySeconds',
      'banEnabled',
      'banDelaySeconds',
      'banTeammateIntendedChampion',
      'benchExpectedChampions',
      'expectedChampions',
      'bannedChampions',
      'benchHandleTradeEnabled',

      'pickConfig',
      'banConfig'
    ])

    this._mobx.propSync(AutoSelectMain.id, 'state', this.state, ['groups', 'temporaryDisabled'])

    await this._fillAutoBanPickConfig()
  }

  async onInit() {
    await this._handleState()
    this._handleIpcCall()

    this._handleBanPickEx()
  }

  /**
   * 给定目标时间点，计算距离英雄选择阶段开始时，还有多久，最小为 0
   *
   * margin: 自动选择会在真正时间点前最晚多久开始执行
   *
   * counterCompensation: 抵消客户端的时间空余，但可能造成不及时
   *
   */
  private _calcShouldWait(offset: number, margin = 0, fill = 0) {
    const t = this.state.timer

    if (!t || t.isInfinite || !t.phase) {
      return offset
    }

    // 达到预期的时间点还有多久
    const target = Math.max(
      offset - Math.max(t.totalTimeInPhase - margin - t.adjustedTimeLeftInPhase - fill, 0),
      0
    )

    return target
  }

  private _backloggedMessages: (() => string)[] = []

  private async _sendCelebration(message: string) {
    if (!this.state.inChampSelect) {
      return
    }

    if (!this.state.chatId) {
      this._backloggedMessages.push(() => message)
      return
    }

    await this._lc.api.chat
      .chatSend(
        this.state.chatId,
        `[${i18next.t('appName', { ns: 'common' })}] ${message}`,
        'celebration'
      )
      .catch(() => {})
  }

  // testing only
  private _handleBanPickEx() {
    this._mobx.reaction(
      () => this.state.chatId,
      (id) => {
        if (!id) {
          return
        }

        const sendMessages = async () => {
          while (this._backloggedMessages.length) {
            const message = this._backloggedMessages.shift()
            if (message) {
              await this._sendCelebration(message())
            }
          }
        }

        sendMessages()
      }
    )

    this._mobx.reaction(
      () => this.state.inChampSelect,
      (hasCsSession) => {
        if (!hasCsSession) {
          this._backloggedMessages = []
          this.state.setTemporaryDisabled(false)
          return
        }
      }
    )

    const banContext = computed(
      () => {
        const banConfig = this.state.activeGroupConfig
        const expected = this.state.expectedBans

        if (!banConfig || !expected) {
          return null
        }

        if (!banConfig.ban.enabled || banConfig.temporaryDisabled) {
          return
        }

        // 非 ban 环节，或者没有 activeAction，则不生效
        if (
          (this.state.move !== 'complete-ban' && this.state.move !== 'show-ban') ||
          !this.state.activeAction
        ) {
          return null
        }

        const expectedBan = expected.find(
          (c) =>
            c.status === 'bannable' || (banConfig.ban.ignoreIntent && c.status === 'pick-intented')
        )

        if (!expectedBan) {
          return null
        }

        const stageOffset =
          banConfig.ban.strategy === 'show-and-lock-in' && this.state.move === 'complete-ban'
            ? banConfig.ban.delaySeconds * 2e3
            : banConfig.ban.delaySeconds * 1e3

        return {
          move: this.state.move,
          activeAction: this.state.activeAction,
          expectedBan: expectedBan,
          niceDelayMs: this._calcShouldWait(stageOffset),
          strategy: banConfig.ban.strategy
        } as const
      },
      { equals: comparer.shallow }
    )

    const ban = async (championId: number, actionId: number, completed: boolean) => {
      try {
        this._log.info(`Banning ${this._debugChampionName(championId)} completed=${completed}`)

        await this._lc.api.champSelect.action(actionId, {
          type: 'ban',
          championId,
          completed
        })
      } catch (error) {
        this._log.warn(
          `Failed to ban champion ${this._debugChampionName(championId)} completed=${completed}`,
          error
        )
      }
    }

    this._mobx.reaction(
      () => banContext.get(),
      (ctx) => {
        if (!ctx) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (this.state.delayedBan) {
            clearTimeout(this.state.delayedBan.timerId)
            this.state.setDelayedBan(null)
          }

          return
        }

        const { move, activeAction, expectedBan, niceDelayMs, strategy } = ctx

        const completed = strategy !== 'just-show' && move === 'complete-ban'

        if (move === 'show-ban') {
          if (activeAction.championId === expectedBan.id) {
            if (this.state.delayedBan) {
              clearTimeout(this.state.delayedBan.timerId)
              this.state.setDelayedBan(null)
              this._log.warn(
                `Already picked, canceling delayed ban ${this._debugChampionName(expectedBan.id)}`
              )
            }

            return
          }
        }

        if (this.state.delayedBan) {
          clearTimeout(this.state.delayedBan.timerId)
        }

        if (
          !this.state.delayedBan ||
          this.state.delayedBan.championId !== expectedBan.id ||
          this.state.delayedBan.completed !== completed
        ) {
          this._sendCelebration(
            `Updated, Ban (complete=${completed}) ${this._debugChampionName(expectedBan.id)} in ${niceDelayMs}ms`
          )
        }

        this.state.setDelayedBan({
          isPickIntent: false,
          completed,
          championId: expectedBan.id,
          delayMs: niceDelayMs,
          startAt: Date.now(),
          finishAt: Date.now() + niceDelayMs,
          timerId: setTimeout(
            () =>
              ban(expectedBan.id, activeAction.id, completed).finally(() =>
                this.state.setDelayedBan(null)
              ),
            niceDelayMs
          )
        })
      }
    )

    // --- pick ---
    const pickContext = computed(
      () => {
        const pickConfig = this.state.activeGroupConfig
        const expected = this.state.expectedPicks

        if (!pickConfig || !expected) {
          return null
        }

        if (!pickConfig.pick.enabled || pickConfig.temporaryDisabled) {
          return
        }

        // 非 pick 环节，或者没有 activeAction，则不生效
        if (
          (this.state.move !== 'pick-intent' &&
            this.state.move !== 'complete-pick' &&
            this.state.move !== 'complete-subset-pick' &&
            this.state.move !== 'show-pick' &&
            this.state.move !== 'show-subset-pick') ||
          !this.state.activeAction
        ) {
          return null
        }

        if (
          this.state.move === 'pick-intent' &&
          (!this.state.firstUnfinishedPickAction || !pickConfig.pick.showIntent)
        ) {
          return null
        }

        const expectedPick = expected.find(
          (c) =>
            c.status === 'pickable' ||
            c.status === 'subset-pickable' ||
            (pickConfig.pick.ignoreIntent && c.status === 'pick-intented')
        )

        if (!expectedPick) {
          return null
        }

        const stageOffset =
          pickConfig.pick.strategy === 'show-and-lock-in' && this.state.move === 'complete-pick'
            ? pickConfig.pick.delaySeconds * 2e3
            : pickConfig.pick.delaySeconds * 1e3 // 包括 show-pick 和 pick-intent

        return {
          move: this.state.move,
          firstUnfinishedPickAction: this.state.firstUnfinishedPickAction,
          activeAction: this.state.activeAction,
          expectedPick: expectedPick,
          niceDelayMs: this._calcShouldWait(stageOffset),
          strategy: pickConfig.pick.strategy
        } as const
      },
      { equals: comparer.shallow }
    )

    const pick = async (championId: number, actionId: number, completed?: boolean) => {
      try {
        this._log.info(`Picking ${this._debugChampionName(championId)} completed=${completed}`)

        await this._lc.api.champSelect.action(actionId, {
          type: 'pick',
          championId,
          completed
        })
      } catch (error) {
        this._log.warn(
          `Failed to pick champion ${this._debugChampionName(championId)} completed=${completed}`,
          error
        )
      }
    }

    const intent = async (championId: number, actionId: number) => {
      try {
        this._log.info(`Intenting ${this._debugChampionName(championId)}`)
        await this._lc.api.champSelect.action(actionId, { championId })
      } catch (error) {
        this._log.warn(`Failed to intent champion ${this._debugChampionName(championId)}`, error)
      }
    }

    /**
     * // 适用于大乱斗抽卡阶段
     * show-subset-pick / complete-subset-pick -> 直接 complete=true
     *
     * show-pick，在 strategy=show-and-lock-in的时候
     */
    this._mobx.reaction(
      () => pickContext.get(),
      (ctx) => {
        if (!ctx) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (this.state.delayedPick) {
            clearTimeout(this.state.delayedPick.timerId)
            this.state.setDelayedBan(null)
          }

          return
        }

        const {
          move,
          firstUnfinishedPickAction,
          activeAction,
          expectedPick,
          niceDelayMs,
          strategy
        } = ctx

        // 接下来针对几种特殊情况取消操作
        if (move === 'complete-pick') {
          // 1. 在 just-show 策略下，对于手上已经存在预期英雄时，取消计时器并返回
          if (strategy === 'just-show' && activeAction.championId === expectedPick.id) {
            if (this.state.delayedPick) {
              this._log.error('canceled just-show')

              clearTimeout(this.state.delayedPick.timerId)
              this.state.setDelayedPick(null)
              this._log.warn(
                `Already picked, canceling delayed pick ${this._debugChampionName(expectedPick.id)} move=${move}`
              )
            }

            return
          }
        } else if (move === 'pick-intent') {
          // 不存在可预选的 action / 已经预选了该英雄
          if (
            !firstUnfinishedPickAction ||
            firstUnfinishedPickAction.championId === expectedPick.id
          ) {
            if (this.state.delayedPick) {
              clearTimeout(this.state.delayedPick.timerId)
              this.state.setDelayedPick(null)
            }

            return
          }
        }

        if (this.state.delayedPick) {
          clearTimeout(this.state.delayedPick.timerId)
        }

        const completed =
          move === 'show-subset-pick' || // subset pick should complete immediately
          move === 'complete-subset-pick' ||
          (strategy !== 'just-show' && move === 'complete-pick')

        if (
          !this.state.delayedPick ||
          this.state.delayedPick.championId !== expectedPick.id ||
          this.state.delayedPick.completed !== completed
        ) {
          this._sendCelebration(
            `Updated, Pick (complete=${completed}) ${this._debugChampionName(expectedPick.id)} in ${niceDelayMs}ms move=${move}`
          )
        }

        if (move === 'pick-intent') {
          if (!firstUnfinishedPickAction) {
            this.state.setDelayedPick(null)
            return
          }

          this.state.setDelayedPick({
            isPickIntent: true,
            completed: false,
            championId: expectedPick.id,
            delayMs: niceDelayMs,
            startAt: Date.now(),
            finishAt: Date.now() + niceDelayMs,
            timerId: setTimeout(
              () =>
                intent(expectedPick.id, firstUnfinishedPickAction.id).finally(() =>
                  this.state.setDelayedPick(null)
                ),
              niceDelayMs
            )
          })
        } else {
          this.state.setDelayedPick({
            isPickIntent: false,
            completed,
            championId: expectedPick.id,
            delayMs: niceDelayMs,
            startAt: Date.now(),
            finishAt: Date.now() + niceDelayMs,
            timerId: setTimeout(
              () =>
                pick(expectedPick.id, activeAction.id, completed).finally(() =>
                  this.state.setDelayedPick(null)
                ),
              niceDelayMs
            )
          })
        }
      }
    )

    const swapContext = computed(() => {
      const pickConfig = this.state.activeGroupConfig
      const expected = this.state.expectedSwaps

      if (!pickConfig || !expected) {
        return null
      }

      if (!pickConfig.pick.enabled || pickConfig.temporaryDisabled) {
        return null
      }

      if (this.state.move !== 'bench-swap' && this.state.move !== 'subset-bench-swap') {
        return null
      }

      const expectedSwapIndex = expected.findIndex(
        (c) => c.status === 'subset-swappable' || c.status === 'swappable'
      )

      if (expectedSwapIndex === -1) {
        return null
      }

      const currentChampionIndex = expected.findIndex((c) => c.id === this.state.currentChampionId)

      // 当手上没有任何合适的英雄，直接锁定第一个预选
      // 对于手上存在合适的英雄，根据情况是否选择更换
      // 如果策略是找到更高优先级的可选英雄，锁定为更高优先级的，否则什么也不做
      if (currentChampionIndex === -1) {
        return {
          expectedSwap: expected[expectedSwapIndex],
          delaySeconds: pickConfig.pick.benchSwapAccumulatedDelaySeconds
        }
      }

      if (
        pickConfig.pick.benchSelectFirstAvailableChampion &&
        expectedSwapIndex < currentChampionIndex
      ) {
        return {
          expectedSwap: expected[expectedSwapIndex],
          delaySeconds: pickConfig.pick.benchSwapAccumulatedDelaySeconds
        }
      }

      return null
    })

    /** 记录英雄变动的时间现成 */
    const benchChampionCooldown = observable.box<Record<number, number> | null>(null)

    const trackCd = (prev: Record<number, number> | null, cur: number[]) => {
      const newObj: Record<number, number> = {}

      cur.forEach((c) => {
        if (!prev || !prev[c]) {
          newObj[c] = Date.now()
        }
      })

      return newObj
    }

    // diff
    this._mobx.reaction(
      () => this.state.benchChampions,
      (bench) => {
        if (!bench) {
          benchChampionCooldown.set(null)
          return
        }

        const newCd = trackCd(
          benchChampionCooldown.get(),
          bench.map((c) => c.championId)
        )
        benchChampionCooldown.set(newCd)
      }
    )

    this._mobx.reaction(
      () => ({
        ctx: swapContext.get(),
        bench: benchChampionCooldown.get()
      }),
      ({ ctx, bench }) => {
        if (!ctx || !bench) {
          if (this.state.delayedSwap) {
            clearTimeout(this.state.delayedSwap.timerId)
            this.state.setDelayedSwap(null)
          }

          return
        }

        // 该英雄出现在备战席上的时间戳
        const axis = bench[ctx.expectedSwap.id]

        if (!axis) {
          if (this.state.delayedSwap) {
            clearTimeout(this.state.delayedSwap.timerId)
            this.state.setDelayedSwap(null)
          }

          return
        }

        const {
          delaySeconds,
          expectedSwap: { id }
        } = ctx

        const swap = async (championId: number) => {
          try {
            this._log.info(`Swapped champion: ${championId}`)
            await this._lc.api.champSelect.benchSwap(championId)
          } catch (error) {
            this._log.warn(`Failed to swap champion`, error)
          }
        }

        // 若存在，则移除
        if (this.state.delayedSwap) {
          clearTimeout(this.state.delayedSwap.timerId)
        }

        const now = Date.now()
        const delayMs = delaySeconds * 1e3 - (now - axis)

        if (!this.state.delayedSwap || id !== this.state.delayedSwap.championId) {
          this._sendCelebration(`Will swap ${this._debugChampionName(id)} in ${delayMs}ms`)
        }

        this.state.setDelayedSwap({
          championId: id,
          delayMs,
          finishAt: now + delayMs,
          startAt: now,
          timerId: setTimeout(
            () => swap(id).finally(() => this.state.setDelayedSwap(null)),
            delayMs
          )
        })
      }
    )

    // for debugging
    // this._mobx.reaction(
    //   () => this.state.move,
    //   (move) => {
    //     this._log.warn(`Move: ${move}`)
    //   }
    // )

    // this._mobx.reaction(
    //   () => this.state.delayedPick,
    //   (delayedPick) => {
    //     this._log.warn(`delayedPick: ${!!delayedPick}`)
    //   }
    // )

    // this._mobx.reaction(
    //   () => this.state.activeGroupConfig,
    //   (move) => {
    //     this._log.warn(`activeGroupConfig: ${move}`)
    //   },
    //   { fireImmediately: true }
    // )
  }

  private _debugChampionName(id: number) {
    return `${this._lc.data.gameData.championName(id)} (${id})`
  }

  private async _acceptOrDeclineTrade(tradeId: number, accept: boolean) {
    if (accept) {
      try {
        await this._lc.api.champSelect.acceptTrade(tradeId)
      } catch (error) {
        this._ipc.sendEvent(AutoSelectMain.id, 'error-accept-trade', tradeId)
        this._log.warn(`Failed to accept swap request`, error)
      }
    } else {
      try {
        await this._lc.api.champSelect.declineTrade(tradeId)
      } catch (error) {
        this._ipc.sendEvent(AutoSelectMain.id, 'error-decline-trade', tradeId)
        this._log.warn(`Failed to decline swap request`, error)
      }
    }
  }

  private async _notifyInChat(type: 'cancel' | 'select', championId: number, time = 0) {
    if (!this._lc.data.chat.conversations.championSelect) {
      return
    }

    try {
      await this._lc.api.chat.chatSend(
        this._lc.data.chat.conversations.championSelect.id,
        type === 'select'
          ? `[League Akari] - ${i18next.t('auto-select-main.grab-soon', {
              seconds: (time / 1000).toFixed(1),
              champion: this._lc.data.gameData.champions[championId]?.name || championId
            })}`
          : `[League Akari] - ${i18next.t('auto-select-main.cancel-grab', {
              champion: this._lc.data.gameData.champions[championId]?.name || championId
            })}`,
        'celebration'
      )
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-chat-send', formatError(error))
      this._log.warn(`Failed to send message`, error)
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      AutoSelectMain.id,
      'setPickConfig',
      async (_, type: string, config: DeepPartialObject<PickChampionConfig>) => {
        this.settings.setPickConfig(type, config)
        await this._setting.set('pickConfig', this.settings.pickConfig)
      }
    )

    this._ipc.onCall(
      AutoSelectMain.id,
      'setBanConfig',
      async (_, type: string, config: DeepPartialObject<BanChampionConfig>) => {
        this.settings.setBanConfig(type, config)
        await this._setting.set('banConfig', this.settings.banConfig)
      }
    )
  }
}
