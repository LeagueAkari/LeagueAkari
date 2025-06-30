import { i18next } from '@main/i18n'
import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatError, formatErrorMessage } from '@shared/utils/errors'
import { comparer, computed } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoSelectSettings, AutoSelectState } from './state'

@Shard(AutoSelectMain.id)
export class AutoSelectMain implements IAkariShardInitDispose {
  static id = 'auto-select-main'

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  public readonly settings = new AutoSelectSettings()
  public readonly state: AutoSelectState

  private _grabTimerId: NodeJS.Timeout | null = null

  private _pickTask = new TimeoutTask()
  private _banTask = new TimeoutTask()

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
        benchHandleTradeEnabled: { default: this.settings.benchHandleTradeEnabled }
      },
      this.settings
    )
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
      'benchHandleTradeEnabled'
    ])

    this._mobx.propSync(AutoSelectMain.id, 'state', this.state, [
      'targetBan',
      'targetPick',
      'memberMe',
      'upcomingGrab',
      'upcomingPick',
      'upcomingBan'
    ])
  }

  private async _pick(championId: number, actionId: number, completed = true) {
    try {
      this._log.info(
        `Now picking: ${this._lc.data.gameData.champions[championId]?.name || championId}, ${this.settings.pickStrategy}, actionId=${actionId}, locked=${completed}`
      )

      await this._lc.api.champSelect.pickOrBan(championId, completed, 'pick', actionId)
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-pick', championId)
      this._sendInChat(
        `[League Akari] ${i18next.t('auto-select-main.error-pick', {
          champion: this._lc.data.gameData.champions[championId]?.name || championId,
          reason: formatErrorMessage(error)
        })}`
      )

      this._log.warn(`Failed to pick, target champion: ${championId}`, error)
    }
  }

  private async _ban(championId: number, actionId: number, completed = true) {
    try {
      await this._lc.api.champSelect.pickOrBan(championId, completed, 'ban', actionId)
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-ban', championId)
      this._sendInChat(
        `[League Akari] ${i18next.t('auto-select-main.error-ban', {
          champion: this._lc.data.gameData.champions[championId]?.name || championId,
          reason: formatErrorMessage(error)
        })}`
      )

      this._log.warn(`Failed to ban, target champion: ${championId}`, error)
    }
  }

  private async _prePick(championId: number, actionId: number) {
    try {
      this._log.info(`Now pre-picking: ${championId}, actionId=${actionId}`)

      await this._lc.api.champSelect.action(actionId, { championId })
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-pre-pick', championId)
      this._sendInChat(
        `[League Akari] ${i18next.t('auto-select-main.error-pre-pick', {
          champion: this._lc.data.gameData.champions[championId]?.name || championId,
          reason: formatErrorMessage(error)
        })}`
      )

      this._log.warn(`Failed to pre-pick, target champion: ${championId}`, error)
    }
  }

  async onInit() {
    await this._handleState()
    this._handleAutoPickBan()
    this._handleBenchMode()
  }

  /**
   * 确保用户设置时间的合理性
   */
  private _calculateAppropriateDelayMs(delayMs: number, margin: number = 1200) {
    const info = this.state.currentPhaseTimerInfo
    if (!info || info.isInfinite) {
      return delayMs
    }

    const maxAllowedDelayMs = info.totalTimeInPhase - margin
    const desiredDelayMs = Math.min(delayMs, maxAllowedDelayMs)
    const adjustedDelayMs = desiredDelayMs - info.adjustedTimeElapsedInPhase

    return Math.max(0, adjustedDelayMs)
  }

  private _cancelPrevScheduledPickIfExists() {
    if (this.state.upcomingPick) {
      if (!this._pickTask.isStarted) {
        return
      }

      this._log.info(
        `Cancelled upcoming auto-pick: ${this._lc.data.gameData.champions[this.state.upcomingPick.championId]?.name || this.state.upcomingPick.championId}`
      )
      this._sendInChat(
        `[${i18next.t('common.appName')}] ${i18next.t('auto-select-main.cancel-delayed-lock-in', {
          champion:
            this._lc.data.gameData.champions[this.state.upcomingPick.championId]?.name ||
            this.state.upcomingPick.championId
        })}`
      )
      this.state.setUpcomingPick(null)
      this._pickTask.cancel()
    }
  }

  private _cancelPrevScheduledBanIfExists() {
    if (this.state.upcomingBan) {
      if (!this._banTask.isStarted) {
        return
      }

      this._log.info(
        `Cancelled upcoming auto-ban: ${this._lc.data.gameData.champions[this.state.upcomingBan.championId]?.name || this.state.upcomingBan.championId}`
      )
      this.state.setUpcomingPick(null)
      this._sendInChat(
        `[${i18next.t('common.appName')}] ${i18next.t('auto-select-main.cancel-delayed-ban', {
          champion:
            this._lc.data.gameData.champions[this.state.upcomingBan.championId]?.name ||
            this.state.upcomingBan.championId
        })}`
      )
    }
  }

  private _handleAutoPickBan() {
    this._mobx.reaction(
      () =>
        [
          this.state.targetPick,
          this.settings.pickStrategy,
          this.settings.lockInDelaySeconds
        ] as const,
      async ([pick, strategy, delay]) => {
        if (!pick) {
          this._cancelPrevScheduledPickIfExists()
          return
        }

        if (pick.isActingNow && pick.action.isInProgress) {
          if (strategy === 'show') {
            if (this.state.champSelectActionInfo?.memberMe.championId !== pick.championId) {
              this._cancelPrevScheduledPickIfExists()
              await this._pick(pick.championId, pick.action.id, false)
            }
          } else if (strategy === 'lock-in') {
            this._cancelPrevScheduledPickIfExists()
            await this._pick(pick.championId, pick.action.id)
          } else if (strategy === 'show-and-delay-lock-in') {
            if (this.state.champSelectActionInfo?.memberMe.championId !== pick.championId) {
              await this._pick(pick.championId, pick.action.id, false)
            }

            this._cancelPrevScheduledPickIfExists()

            const delayMs = this._calculateAppropriateDelayMs(delay * 1e3)

            this._log.info(
              `Added delayed pick task: ${delay * 1e3} (adjusted: ${delayMs}), target champion: ${this._lc.data.gameData.champions[pick.championId]?.name || pick.championId}`
            )

            this._sendInChat(
              `[${i18next.t('common.appName')}] ${i18next.t('auto-select-main.delayed-lock-in', {
                champion:
                  this._lc.data.gameData.champions[pick.championId]?.name || pick.championId,
                seconds: (delayMs / 1e3).toFixed(1)
              })}`
            )

            this.state.setUpcomingPick(pick.championId, Date.now() + delayMs)
            this._pickTask.setTask(
              () =>
                this._pick(pick.championId, pick.action.id).finally(() =>
                  this.state.setUpcomingPick(null)
                ),
              true,
              delayMs
            )
          }

          return
        }

        if (!pick.isActingNow) {
          if (!this.settings.showIntent) {
            return
          }

          // 非自定义且未选择英雄
          if (
            this.state.champSelectActionInfo?.session.isCustomGame ||
            this.state.champSelectActionInfo?.memberMe.championId
          ) {
            return
          }

          const thatAction = this.state.champSelectActionInfo?.pick.find(
            (a) => a.id === pick.action.id
          )
          if (thatAction && thatAction.championId === pick.championId) {
            return
          }

          await this._prePick(pick.championId, pick.action.id)
          return
        }
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => [this.state.targetBan, this.settings.banDelaySeconds] as const,
      async ([ban, delay]) => {
        if (!ban) {
          this._cancelPrevScheduledBanIfExists()
          return
        }

        if (ban.action.isInProgress && ban.isActingNow) {
          this._cancelPrevScheduledBanIfExists()

          const delayMs = this._calculateAppropriateDelayMs(delay * 1e3)
          this._log.info(
            `Added delayed ban task: ${delay * 1e3} (adjusted: ${delayMs}), target champion: ${this._lc.data.gameData.champions[ban.championId]?.name || ban.championId}`
          )
          this._sendInChat(
            `[${i18next.t('common.appName')}] ${i18next.t('auto-select-main.delayed-ban', {
              champion: this._lc.data.gameData.champions[ban.championId]?.name || ban.championId,
              seconds: (delayMs / 1e3).toFixed(1)
            })}`
          )
          this.state.setUpcomingBan(ban.championId, Date.now() + delayMs)
          this._banTask.setTask(
            () => {
              this._ban(ban.championId, ban.action.id)
              this.state.setUpcomingBan(null)
            },
            true,
            delayMs
          )
        }
      },
      { equals: comparer.structural }
    )

    // 用于校正时间
    this._mobx.reaction(
      () => this.state.currentPhaseTimerInfo,
      (_timer) => {
        if (this.state.upcomingPick) {
          const adjustedDelayMs = this._calculateAppropriateDelayMs(
            this.settings.lockInDelaySeconds * 1e3
          )

          this._pickTask.updateTime(adjustedDelayMs)
        }

        if (this.state.upcomingBan) {
          const adjustedDelayMs = this._calculateAppropriateDelayMs(
            this.settings.banDelaySeconds * 1e3
          )

          this._banTask.updateTime(adjustedDelayMs)
        }
      }
    )

    this._mobx.reaction(
      () => this.state.upcomingGrab,
      (grab) => {
        this._log.info(`Upcoming Grab - swap scheduled`, grab)
      }
    )

    // for logging only
    const positionInfo = computed(
      () => {
        if (!this.state.champSelectActionInfo) {
          return null
        }

        if (!this.settings.normalModeEnabled || !this.settings.banEnabled) {
          return null
        }

        const position = this.state.champSelectActionInfo.memberMe.assignedPosition

        const championsBan = this.settings.bannedChampions
        const championsPick = this.settings.expectedChampions

        return {
          position,
          ban: championsBan,
          pick: championsPick
        }
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => positionInfo.get(),
      (info) => {
        if (info) {
          this._log.info(
            `Assigned position: ${info.position || '<empty>'}, preset pick: ${JSON.stringify(info.pick)}, preset ban: ${JSON.stringify(info.ban)}`
          )
        }
      }
    )

    this._mobx.reaction(
      () => this._lc.data.chat.conversations.championSelect?.id,
      (id) => {
        if (id && this._lc.data.gameflow.phase === 'ChampSelect') {
          if (!this._lc.data.champSelect.session) {
            return
          }

          const texts: string[] = []
          if (!this._lc.data.champSelect.session.benchEnabled && this.settings.normalModeEnabled) {
            texts.push(i18next.t('auto-select-main.auto-pick-normal-mode'))
          }

          if (this._lc.data.champSelect.session.benchEnabled && this.settings.benchModeEnabled) {
            texts.push(i18next.t('auto-select-main.auto-grab-bench-mode'))
          }

          if (!this._lc.data.champSelect.session.benchEnabled && this.settings.banEnabled) {
            let hasBanAction = false
            for (const arr of this._lc.data.champSelect.session.actions) {
              if (arr.findIndex((a) => a.type === 'ban') !== -1) {
                hasBanAction = true
                break
              }
            }
            if (hasBanAction) {
              texts.push(i18next.t('auto-select-main.auto-ban'))
            }
          }

          if (texts.length) {
            this._sendInChat(
              `[League Akari] ${i18next.t('auto-select-main.enabled')} ${texts.join(' | ')}`
            )
          }
        }
      }
    )
  }

  private _handleBenchMode() {
    interface BenchChampionInfo {
      // 最近一次在英雄选择台上的时间
      lastTimeOnBench: number
    }

    // 追踪了英雄选择信息的细节 k = 英雄 ID，v = 英雄信息
    const benchChampions = new Map<number, BenchChampionInfo>()

    const diffBenchAndUpdate = (prevBench: number[], newBench: number[], time: number) => {
      // 多出来的英雄，新的有但上一次没有
      newBench.forEach((c) => {
        if (!prevBench.includes(c)) {
          benchChampions.set(c, { lastTimeOnBench: time })
        }
      })

      // 消失的英雄，旧的有但新的没有
      prevBench.forEach((c) => {
        if (!newBench.includes(c)) {
          benchChampions.delete(c)
        }
      })
    }

    const simplifiedCsSession = computed(() => {
      if (!this._lc.data.champSelect.session) {
        return null
      }

      const { benchEnabled, localPlayerCellId, benchChampions, myTeam } =
        this._lc.data.champSelect.session

      return {
        benchEnabled,
        localPlayerCellId,
        benchChampions,
        myTeam,
        timerPhase: this._lc.data.champSelect.session.timer.phase,
        subsetChampionList: this._lc.data.lobbyTeamBuilder.champSelect.subsetChampionList
      }
    })

    this._mobx.reaction(
      () =>
        [
          simplifiedCsSession.get(),
          this.settings.benchExpectedChampions,
          this.settings.benchModeEnabled,
          this.settings.benchSelectFirstAvailableChampion
        ] as const,
      ([session, expected, enabled, onlyFirst], [prevSession]) => {
        if (!session) {
          // session 被清空的情况, 区分一开始就没有的情况
          if (prevSession) {
            benchChampions.clear()
          }
          return
        }

        if (!session.benchEnabled) {
          return
        }

        // Diff
        const now = Date.now()
        diffBenchAndUpdate(
          prevSession?.benchChampions.map((c) => c.championId) || [],
          session.benchChampions.map((c) => c.championId),
          now
        )

        if (!enabled) {
          if (this.state.upcomingGrab) {
            this._log.info(
              `Closed this feature, canceling upcoming swap: ID: ${this.state.upcomingGrab.championId}`
            )
            this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
          }
          return
        }

        // 当前会话中可选的英雄
        const availableExpectedChampions = expected.filter(
          (c) =>
            this._lc.data.champSelect.currentPickableChampionIds.has(c) &&
            !this._lc.data.champSelect.disabledChampionIds.has(c) &&
            !(session.timerPhase === 'BAN_PICK' && !session.subsetChampionList.includes(c)) // waitingOnFinalizationPhase
        )
        const pickableChampionsOnBench = availableExpectedChampions.filter((c) =>
          benchChampions.has(c)
        )

        // 本次变更, 如果有即将进行的交换, 则根据情况判断是否应该取消
        if (this.state.upcomingGrab) {
          if (pickableChampionsOnBench.length === 0) {
            this._log.info(
              `No available champions, canceling upcoming swap: ID: ${this.state.upcomingGrab.championId}`
            )
            this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
            return
          }

          if (onlyFirst) {
            // 对于 onlyFirst 的情况, 如果预计的英雄仍位于可选的第一位, 那么就返回
            if (pickableChampionsOnBench[0] === this.state.upcomingGrab.championId) {
              return
            } else {
              this._log.info(
                `Not preferred champion, canceling upcoming swap: ID: ${this.state.upcomingGrab.championId}`
              )
              this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
              clearTimeout(this._grabTimerId!)
              this._grabTimerId = null
              this.state.setUpcomingGrab(null)
            }
          } else {
            // 对于非 onlyFirst 的情况, 只要目标还在期望列表中，且仍在选择台中, 那么直接返回
            if (pickableChampionsOnBench.includes(this.state.upcomingGrab.championId)) {
              return
            } else {
              this._log.info(
                `Not in expected list, canceling upcoming swap: ID: ${this.state.upcomingGrab.championId}`
              )
              this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
              clearTimeout(this._grabTimerId!)
              this._grabTimerId = null
              this.state.setUpcomingGrab(null)
            }
          }
        }

        if (pickableChampionsOnBench.length === 0) {
          return
        }

        const selfChampionId = session.myTeam.find(
          (v) => v.cellId === session.localPlayerCellId
        )?.championId

        if (!selfChampionId) {
          return
        }

        if (onlyFirst) {
          // 对于 onlyFirst, 如果手上的英雄优先级比较高, 那么没有必要再次选择
          const indexInHand = availableExpectedChampions.indexOf(selfChampionId)
          const indexInFirstPickable = availableExpectedChampions.indexOf(
            pickableChampionsOnBench[0]
          )

          if (indexInHand !== -1 && indexInHand < indexInFirstPickable) {
            return
          }
        } else {
          // 对于非 onlyFirst, 如果自己的英雄在期望列表中, 那么没有必要再次选择
          if (availableExpectedChampions.includes(selfChampionId)) {
            return
          }
        }

        // 或许有用
        clearTimeout(this._grabTimerId!)

        const newTarget = pickableChampionsOnBench[0]
        const waitTime = Math.max(
          this.settings.grabDelaySeconds * 1e3 -
            (now - benchChampions.get(newTarget)!.lastTimeOnBench),
          0
        )

        this._log.info(`Target swap champion: ${newTarget}`)
        this.state.setUpcomingGrab(newTarget, Date.now() + waitTime)
        this._notifyInChat('select', this.state.upcomingGrab!.championId, waitTime).catch(() => {})
        this._grabTimerId = setTimeout(() => this._trySwap(), waitTime)
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () =>
        [
          this._lc.data.champSelect.ongoingTrade,
          this.settings.benchHandleTradeEnabled,
          this.settings.benchSelectFirstAvailableChampion
        ] as const,
      ([trade, enabled, onlyFirst]) => {
        if (!trade || !enabled) {
          return
        }

        // 只处理接受到的邀请
        if (trade.state !== 'RECEIVED') {
          return
        }

        const session = this._lc.data.champSelect.session
        if (!session) {
          return
        }

        const { id } = trade
        const t = session.trades.find((t) => t.id === id)

        if (!t) {
          return
        }

        const from = session.myTeam.find((v) => v.cellId === t.cellId)
        const self = session.myTeam.find((v) => v.cellId === session.localPlayerCellId)
        if (!from || !self) {
          return
        }

        this._log.info(`Received swap request: ${from.championId} -> ${self.championId}`)

        const requesterChampionId = from.championId
        const hasExpected = this.settings.benchExpectedChampions.includes(self.championId)

        if (hasExpected) {
          if (onlyFirst) {
            const indexInHand = this.settings.benchExpectedChampions.indexOf(self.championId) // 永远不可能为 -1
            const indexHim = this.settings.benchExpectedChampions.indexOf(requesterChampionId)

            if (indexHim === -1 || indexInHand < indexHim) {
              this._log.info(
                `Declined swap request: ${from.championId} -> ${self.championId}, because target is lower priority`
              )
              this._acceptOrDeclineTrade(id, false)
            } else {
              this._log.info(
                `Accepted swap request: ${from.championId} -> ${self.championId}, target has higher priority`
              )
              this._acceptOrDeclineTrade(id, true)
            }
          } else {
            this._acceptOrDeclineTrade(id, false)
          }
        } else {
          if (this.settings.benchExpectedChampions.includes(requesterChampionId)) {
            this._log.info(
              `Accepted swap request: ${from.championId} -> ${self.championId}, target champion is expected`
            )
            this._acceptOrDeclineTrade(id, true)
          } else {
            this._sendInChat(
              `[League Akari] ${i18next.t('auto-select-main.ignore-trade', {
                from: this._lc.data.gameData.champions[from.championId]?.name || from.championId,
                to: this._lc.data.gameData.champions[self.championId]?.name || self.championId
              })}`
            )
          }
        }
      }
    )

    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        if (phase !== 'ChampSelect' && this.state.upcomingGrab) {
          this.state.setUpcomingGrab(null)
          this._grabTimerId = null
        }
      }
    )
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

  private async _trySwap() {
    if (!this.state.upcomingGrab) {
      return
    }

    const { championId = -1 } = this.state.upcomingGrab

    try {
      await this._lc.api.champSelect.benchSwap(championId)
      this._log.info(`Swapped champion: ${championId}`)
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-bench-swap', championId)
      this._sendInChat(
        `[League Akari] ${i18next.t('auto-select-main.error-bench-swap', {
          champion: this._lc.data.gameData.champions[championId]?.name || championId,
          reason: formatErrorMessage(error)
        })}`
      )
      this._log.warn(`Failed to swap champion`, error)
    } finally {
      // TODO 使用新代码
      this._grabTimerId = null
      this.state.setUpcomingGrab(null)
    }
  }

  private _sendInChat(message: string) {
    if (!this._lc.data.chat.conversations.championSelect) {
      return
    }

    this._lc.api.chat
      .chatSend(this._lc.data.chat.conversations.championSelect.id, message, 'celebration')
      .catch(() => {})
  }
}
