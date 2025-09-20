import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatError } from '@shared/utils/errors'
import { DeepPartialObject } from '@shared/utils/types'
import _ from 'lodash'
import { comparer, computed, observable, runInAction } from 'mobx'

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

    this._mobx.propSync(AutoSelectMain.id, 'settings', this.settings, ['pickConfig', 'banConfig'])

    this._mobx.propSync(AutoSelectMain.id, 'state', this.state, [
      'groups',
      'temporarilyDisabled',
      'delayedBan',
      'delayedPick',
      'delayedBenchSwap',
      'delayedChampionSwap',
      'expectedPicks',
      'expectedBans',
      'expectedSwaps'
    ])

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
          this.state.setTemporarilyDisabled(false)
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

        if (!banConfig.ban.enabled || banConfig.temporarilyDisabled) {
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
          delayMs: this._calcShouldWait(stageOffset),
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

    // --- ban ---
    this._mobx.reaction(
      () => banContext.get(),
      (ctx) => {
        if (!ctx) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (this.state._delayedBan) {
            clearTimeout(this.state._delayedBan.timerId)
            this.state.setDelayedBan(null)
          }

          return
        }

        const { move, activeAction, expectedBan, delayMs, strategy } = ctx

        const completed = strategy !== 'just-show' && move === 'complete-ban'

        if (move === 'show-ban') {
          if (activeAction.championId === expectedBan.id) {
            if (this.state._delayedBan) {
              clearTimeout(this.state._delayedBan.timerId)
              this.state.setDelayedBan(null)
              this._log.warn(
                `Already picked, canceling delayed ban ${this._debugChampionName(expectedBan.id)}`
              )
            }

            return
          }
        }

        if (this.state._delayedBan) {
          clearTimeout(this.state._delayedBan.timerId)
        }

        if (
          !this.state._delayedBan ||
          this.state._delayedBan.championId !== expectedBan.id ||
          this.state._delayedBan.completed !== completed
        ) {
          this._sendCelebration(
            `Updated, Ban (complete=${completed}) ${this._debugChampionName(expectedBan.id)} in ${delayMs}ms`
          )
        }

        this.state.setDelayedBan({
          isPickIntent: false,
          completed,
          championId: expectedBan.id,
          delayMs,
          startAt: this.state.delayedBan?.startAt ?? Date.now(),
          finishAt: Date.now() + delayMs,
          timerId: setTimeout(
            () =>
              ban(expectedBan.id, activeAction.id, completed).finally(() =>
                this.state.setDelayedBan(null)
              ),
            delayMs
          )
        })
      }
    )

    const pickContext = computed(
      () => {
        const pickConfig = this.state.activeGroupConfig
        const expected = this.state.expectedPicks

        if (!pickConfig || !expected) {
          return null
        }

        if (!pickConfig.pick.enabled || pickConfig.temporarilyDisabled) {
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
          delayMs: this._calcShouldWait(stageOffset),
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

    // --- pick ---
    this._mobx.reaction(
      () => pickContext.get(),
      (ctx) => {
        if (!ctx) {
          // 不生效的场合，将立即尝试取消之前设置的任何计时器，并清除状态
          if (this.state._delayedPick) {
            clearTimeout(this.state._delayedPick.timerId)
            this.state.setDelayedPick(null)
          }

          return
        }

        const { move, firstUnfinishedPickAction, activeAction, expectedPick, delayMs, strategy } =
          ctx

        // 接下来针对几种特殊情况取消操作
        if (move === 'complete-pick') {
          // 1. 在 just-show 策略下，对于手上已经存在预期英雄时，取消计时器并返回
          if (strategy === 'just-show' && activeAction.championId === expectedPick.id) {
            if (this.state._delayedPick) {
              this._log.error('canceled just-show')

              clearTimeout(this.state._delayedPick.timerId)
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
            if (this.state._delayedPick) {
              clearTimeout(this.state._delayedPick.timerId)
              this.state.setDelayedPick(null)
            }

            return
          }
        }

        if (this.state._delayedPick) {
          clearTimeout(this.state._delayedPick.timerId)
        }

        const completed =
          move === 'show-subset-pick' || // subset pick should complete immediately
          move === 'complete-subset-pick' ||
          (strategy !== 'just-show' && move === 'complete-pick')

        if (
          !this.state._delayedPick ||
          this.state._delayedPick.championId !== expectedPick.id ||
          this.state._delayedPick.completed !== completed
        ) {
          this._sendCelebration(
            `Updated, Pick (complete=${completed}) ${this._debugChampionName(expectedPick.id)} in ${delayMs}ms move=${move}`
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
            delayMs: delayMs,
            startAt: this.state.delayedPick?.startAt ?? Date.now(),
            finishAt: Date.now() + delayMs,
            timerId: setTimeout(
              () =>
                intent(expectedPick.id, firstUnfinishedPickAction.id).finally(() =>
                  this.state.setDelayedPick(null)
                ),
              delayMs
            )
          })
        } else {
          this.state.setDelayedPick({
            isPickIntent: false,
            completed,
            championId: expectedPick.id,
            delayMs: delayMs,
            startAt: this.state.delayedPick?.startAt ?? Date.now(),
            finishAt: Date.now() + delayMs,
            timerId: setTimeout(
              () =>
                pick(expectedPick.id, activeAction.id, completed).finally(() =>
                  this.state.setDelayedPick(null)
                ),
              delayMs
            )
          })
        }
      }
    )

    /** 记录英雄变动的时间现成 */
    const benchChampionCooldown = observable.box<Record<number, number> | null>(null)

    const trackCd = (prev: Record<number, number> | null, cur: number[]) => {
      const newObj: Record<number, number> = {}

      cur.forEach((c) => {
        if (!prev || !prev[c]) {
          newObj[c] = Date.now()
        } else {
          newObj[c] = prev[c]
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

    const benchSwapContext = computed(() => {
      const bench = benchChampionCooldown.get()
      if (!bench) {
        return null
      }

      const pickConfig = this.state.activeGroupConfig
      const expected = this.state.expectedSwaps

      if (!pickConfig || !expected) {
        return null
      }

      if (!pickConfig.pick.enabled || pickConfig.temporarilyDisabled) {
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
          delayMs: Math.max(0, delayMs)
        }
      }

      return null
    })

    const swap = async (championId: number) => {
      try {
        this._log.info(`Swapped champion: ${championId}`)
        await this._lc.api.champSelect.benchSwap(championId)
      } catch (error) {
        this._log.warn(`Failed to swap champion`, error)
      }
    }

    // --- swap ---
    this._mobx.reaction(
      () => benchSwapContext.get(),
      (ctx) => {
        if (!ctx) {
          if (this.state._delayedBenchSwap) {
            clearTimeout(this.state._delayedBenchSwap.timerId)
            this.state.setDelayedBenchSwap(null)
          }

          return
        }

        const {
          delayMs,
          expectedSwap: { id }
        } = ctx

        if (this.state._delayedBenchSwap) {
          clearTimeout(this.state._delayedBenchSwap.timerId)
        }

        if (!this.state._delayedBenchSwap || id !== this.state._delayedBenchSwap.championId) {
          this._sendCelebration(`Will swap ${this._debugChampionName(id)} in ${delayMs}ms`)
        }

        this.state.setDelayedBenchSwap({
          championId: id,
          delayMs,
          finishAt: Date.now() + delayMs,
          startAt: this.state.delayedBenchSwap?.startAt ?? Date.now(),
          timerId: setTimeout(
            () => swap(id).finally(() => this.state.setDelayedBenchSwap(null)),
            delayMs
          )
        })
      }
    )

    /** 记录其可用的时间，在没有基准的时候手动提供基准 */
    this._mobx.reaction(
      () => this.state.ongoingChampionSwap,
      (trade, prev) => {
        if (!trade || trade.state !== 'RECEIVED') {
          this.state.setOngoingChampionSwapCreatedAt(null)
          return
        }

        // 仅在第一次**收到** trade 时，记录其可用的时间
        if (!prev && trade.state === 'RECEIVED') {
          this.state.setOngoingChampionSwapCreatedAt(Date.now())
        }
      },
      { fireImmediately: true }
    )

    const championSwapContext = computed(
      () => {
        if (!this.state.ongoingChampionSwapCreatedAt || !this.state.myTeamSlotChampions.length) {
          return null
        }

        const pickConfig = this.state.activeGroupConfig
        const expected = this.state.expectedSwaps

        if (
          !pickConfig ||
          !pickConfig.pick.enabled ||
          !expected ||
          !this.state.ongoingChampionSwapCreatedAt
        ) {
          return null
        }

        if (!this.state.ongoingChampionSwap) {
          return null
        }

        const tradeId = this.state.ongoingChampionSwap.id
        const herChampionId = this.state.ongoingChampionSwap.requesterChampionId

        const delayMs =
          pickConfig.pick.delaySeconds * 1e3 -
          (Date.now() - this.state.ongoingChampionSwapCreatedAt)

        const timeLeft =
          this.state.inFinalizationPhase && this.state.timer
            ? this.state.timer.adjustedTimeLeftInPhase - 2000
            : 0.114514 * 1e7 // 很大的值

        const herIndex = expected.findIndex((c) => c.id === herChampionId)

        if (herIndex === -1) {
          return {
            action: 'decline',
            delayMs: Math.min(timeLeft, Math.max(0, delayMs)),
            requesterChampionId: herChampionId,
            tradeId: tradeId
          }
        }

        const handIndex = expected.findIndex((c) => c.id === this.state.currentChampionId)

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

    const acceptChampionSwap = async (tradeId: number) => {
      try {
        await this._lc.api.champSelect.acceptChampionSwap(tradeId)
      } catch (error) {
        this._log.warn(`Failed to accept champion swap`, error)
      }
    }

    const declineChampionSwap = async (tradeId: number) => {
      try {
        await this._lc.api.champSelect.declineChampionSwap(tradeId)
      } catch (error) {
        this._log.warn(`Failed to decline champion swap`, error)
      }
    }

    // --- trade: champion swap ---
    this._mobx.reaction(
      () => championSwapContext.get(),
      (ctx) => {
        if (!ctx) {
          if (this.state._delayedChampionSwap) {
            clearTimeout(this.state._delayedChampionSwap.timerId)
            this.state.setDelayedChampionSwap(null)
          }

          return
        }

        if (this.state._delayedChampionSwap) {
          clearTimeout(this.state._delayedChampionSwap.timerId)
        }

        const { action, delayMs, requesterChampionId, tradeId } = ctx

        if (
          !this.state._delayedChampionSwap ||
          this.state._delayedChampionSwap.action !== action ||
          this.state._delayedChampionSwap.tradeId !== tradeId ||
          this.state._delayedChampionSwap.requesterChampionId !== requesterChampionId
        ) {
          this._sendCelebration(`Will ${action} trade in ${delayMs}ms`)
        }

        if (action === 'accept') {
          this.state.setDelayedChampionSwap({
            action,
            tradeId: tradeId,
            delayMs,
            finishAt: Date.now() + delayMs,
            startAt: this.state.delayedChampionSwap?.startAt ?? Date.now(),
            requesterChampionId: requesterChampionId,
            timerId: setTimeout(
              () =>
                acceptChampionSwap(tradeId).finally(() => this.state.setDelayedChampionSwap(null)),
              delayMs
            )
          })
        } else if (action === 'decline') {
          this.state.setDelayedChampionSwap({
            action,
            tradeId: tradeId,
            delayMs,
            finishAt: Date.now() + delayMs,
            startAt: this.state.delayedChampionSwap?.startAt ?? Date.now(),
            requesterChampionId: requesterChampionId,
            timerId: setTimeout(
              () =>
                declineChampionSwap(tradeId).finally(() => this.state.setDelayedChampionSwap(null)),
              delayMs
            )
          })
        } else {
          this.state.setDelayedChampionSwap(null)
        }
      },
      { fireImmediately: true }
    )

    // for debugging
    // this._mobx.reaction(
    //   () => this.state.move,
    //   (move) => {
    //     this._log.warn(`Move: ${move}`)
    //   }
    // )

    // this._mobx.reaction(
    //   () => benchSwapContext.get(),
    //   (ctx) => {
    //     this._log.warn(`benchSwapContext:`, ctx)
    //   },
    //   { fireImmediately: true }
    // )

    // this._mobx.reaction(
    //   () => this.state.activeGroupConfig,
    //   (groups) => {
    //     this._log.warn(
    //       `activeGroupConfig`,
    //       groups?.pick.champions.default.map((c) => this._lc.data.gameData.championName(c))
    //     )
    //   },
    //   { fireImmediately: true }
    // )

    // this._mobx.reaction(
    //   () => this.state.expectedSwaps,
    //   (swaps) => {
    //     this._log.warn(
    //       `expectedSwaps`,
    //       swaps?.map((c) => ({
    //         name: this._lc.data.gameData.championName(c.id),
    //         status: c.status
    //       }))
    //     )
    //   },
    //   { fireImmediately: true }
    // )
  }

  private _debugChampionName(id: number) {
    return `${this._lc.data.gameData.championName(id)} (${id})`
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

    this._ipc.onCall(
      AutoSelectMain.id,
      'setTemporarilyDisabled',
      async (_, temporarilyDisabled: boolean) => {
        this.state.setTemporarilyDisabled(temporarilyDisabled)
      }
    )
  }
}
