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

    this._mobx.propSync(AutoSelectMain.id, 'state', this.state, [
      'targetBan',
      'targetPick',
      'memberMe',
      'upcomingGrab',
      'upcomingPick',
      'upcomingBan',

      'groups',
      'temporaryDisabled'
    ])

    await this._fillAutoBanPickConfig()
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
    this._handleIpcCall()
    this._handleAutoPickBan()
    this._handleBenchMode()

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
  private _calcShouldWait(offset: number, margin = 0, fill = 3000) {
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

  private _cancelPrevScheduledPickIfExists() {
    if (this.state.upcomingPick) {
      if (!this._pickTask.isStarted) {
        return
      }

      this._log.info(
        `Cancelled upcoming auto-pick: ${this._lc.data.gameData.champions[this.state.upcomingPick.championId]?.name || this.state.upcomingPick.championId}`
      )
      this._sendInChat(
        `[${i18next.t('appName', { ns: 'common' })}] ${i18next.t(
          'auto-select-main.cancel-delayed-lock-in',
          {
            champion:
              this._lc.data.gameData.champions[this.state.upcomingPick.championId]?.name ||
              this.state.upcomingPick.championId
          }
        )}`
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
        `[${i18next.t('appName', { ns: 'common' })}] ${i18next.t(
          'auto-select-main.cancel-delayed-ban',
          {
            champion:
              this._lc.data.gameData.champions[this.state.upcomingBan.championId]?.name ||
              this.state.upcomingBan.championId
          }
        )}`
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

            const delayMs = this._calcShouldWait(delay * 1e3)

            this._log.info(
              `Added delayed pick task: ${delay * 1e3} (adjusted: ${delayMs}), target champion: ${this._lc.data.gameData.champions[pick.championId]?.name || pick.championId}`
            )

            this._sendInChat(
              `[${i18next.t('appName', { ns: 'common' })}] ${i18next.t(
                'auto-select-main.delayed-lock-in',
                {
                  champion:
                    this._lc.data.gameData.champions[pick.championId]?.name || pick.championId,
                  seconds: (delayMs / 1e3).toFixed(1)
                }
              )}`
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

          const delayMs = this._calcShouldWait(delay * 1e3)
          this._log.info(
            `Added delayed ban task: ${delay * 1e3} (adjusted: ${delayMs}), target champion: ${this._lc.data.gameData.champions[ban.championId]?.name || ban.championId}`
          )
          this._sendInChat(
            `[${i18next.t('appName', { ns: 'common' })}] ${i18next.t(
              'auto-select-main.delayed-ban',
              {
                champion: this._lc.data.gameData.champions[ban.championId]?.name || ban.championId,
                seconds: (delayMs / 1e3).toFixed(1)
              }
            )}`
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
      () => this.state.timer,
      (_timer) => {
        if (this.state.upcomingPick) {
          const adjustedDelayMs = this._calcShouldWait(this.settings.lockInDelaySeconds * 1e3)

          this._pickTask.updateTime(adjustedDelayMs)
        }

        if (this.state.upcomingBan) {
          const adjustedDelayMs = this._calcShouldWait(this.settings.banDelaySeconds * 1e3)

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

      const { benchEnabled, localPlayerCellId, benchChampions, myTeam, actions } =
        this._lc.data.champSelect.session

      const firstPickActionForMe = actions.flat().find((a) => {
        return a.type === 'pick' && !a.completed && a.actorCellId === localPlayerCellId
      })

      return {
        benchEnabled,
        localPlayerCellId,
        benchChampions,
        myTeam,
        firstPickActionId: firstPickActionForMe?.id,
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
              `Auto grab disabled, canceling upcoming swap: ID: ${this.state.upcomingGrab.championId}`
            )
            this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
          }
          return
        }

        // TODO: REFACTOR THIS
        // 临时应对新版 ARAM 的策略
        // BAN_PICK 阶段可以先直接选上
        if (session.timerPhase === 'BAN_PICK' && session.firstPickActionId !== undefined) {
          const selfChampionId = session.myTeam.find(
            (v) => v.cellId === session.localPlayerCellId
          )?.championId

          // 0 = 未选
          if (selfChampionId === 0) {
            const availableChampions = session.subsetChampionList.filter(
              (c) =>
                this._lc.data.champSelect.currentPickableChampionIds.has(c) &&
                !this._lc.data.champSelect.disabledChampionIds.has(c)
            )

            const pickableOnSubset = expected.filter((c) => availableChampions.includes(c))

            if (pickableOnSubset.length > 0) {
              this._lc.api.champSelect.pickOrBan(
                pickableOnSubset[0],
                true,
                'pick',
                session.firstPickActionId
              )
            }
          }
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

  private _sendCelebration(message: string) {
    if (!this._lc.data.chat.conversations.championSelect) {
      return
    }

    this._lc.api.chat
      .chatSend(
        this._lc.data.chat.conversations.championSelect.id,
        `[${i18next.t('appName', { ns: 'common' })}] ${message}`,
        'celebration'
      )
      .catch(() => {})
  }

  // testing only
  private _handleBanPickEx() {
    // clear temp state periodically
    this._mobx.reaction(
      () => this._lc.data.gameflow.session?.phase,
      (phase) => {
        if (phase === 'ChampSelect') {
          this.state.setTemporaryDisabled(false)
        }
      },
      { fireImmediately: true }
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

    let shouldIgnoreNextComplete = false

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

    this._mobx.reaction(
      () => this.state.delayedPick,
      (delayedPick) => {
        this._log.warn(`delayedPick: ${!!delayedPick}`)
      }
    )

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
