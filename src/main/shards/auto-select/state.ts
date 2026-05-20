import { DeepPartialObject } from '@shared/utils/types'
import _ from 'lodash'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'
import { RemoteConfigState } from '../remote-config/state'
import {
  getActiveAction,
  getActiveGroupConfig,
  getCorrectedTimer,
  getCurrentActions,
  getCurrentSessionChampionId,
  getExpectedBans,
  getExpectedPicks,
  getExpectedSwaps,
  getFirstUnfinishedPickAction,
  getMove,
  getScopedBenchChampions
} from './computed-state'

export type AutoPickBanStrategy = 'just-show' | 'show-and-lock-in' | 'lock-in-immediately'

export const NONE_CHAMPION_ID = -1
export const RANDOM_CHAMPION_ID = -2
export const CHEERY_BRAVERY_ID = -3

interface PositionChampion {
  // non-ranked queues
  default: number[]

  // ranked queues
  top: number[]
  jungle: number[]
  middle: number[]
  bottom: number[]
  utility: number[]

  [key: string]: number[]
}

export interface PickChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  ignoreIntent: boolean
  strategy: AutoPickBanStrategy
  showIntent: boolean

  // bench mode only
  benchSelectFirstAvailableChampion: boolean
  benchSwapAccumulatedDelaySeconds: number
  benchHandleTradeEnabled: boolean
}

export interface BanChampionConfig {
  enabled: boolean
  champions: PositionChampion
  strategy: AutoPickBanStrategy
  delaySeconds: number
}

export interface DelayedBanPick {
  isPickIntent: boolean
  completed: boolean
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
  timerId: NodeJS.Timeout
}

export interface DelayedBenchSwap {
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
  timerId: NodeJS.Timeout
}

export interface DelayedChampionSwap {
  action: 'accept' | 'decline'
  tradeId: number
  delayMs: number
  startAt: number
  finishAt: number
  requesterChampionId: number
  timerId: NodeJS.Timeout
}

export class AutoSelectSettings {
  // modeTypeKey, configObject
  pickConfig: Record<string, PickChampionConfig> = {}
  banConfig: Record<string, BanChampionConfig> = {}

  createNewEmptyPickConfig(): PickChampionConfig {
    return {
      enabled: false,
      champions: {
        top: [],
        jungle: [],
        middle: [],
        bottom: [],
        utility: [],
        default: []
      },
      ignoreIntent: false,
      showIntent: false,
      delaySeconds: 0,
      strategy: 'show-and-lock-in',
      benchHandleTradeEnabled: false,
      benchSelectFirstAvailableChampion: false,
      benchSwapAccumulatedDelaySeconds: 2.9
    }
  }

  createNewEmptyBanConfig(): BanChampionConfig {
    return {
      enabled: false,
      champions: {
        top: [],
        jungle: [],
        middle: [],
        bottom: [],
        utility: [],
        default: []
      },
      delaySeconds: 0,
      strategy: 'show-and-lock-in'
    }
  }

  setPickConfig(groupId: string, config: DeepPartialObject<PickChampionConfig>) {
    const nextAll = _.cloneDeep(this.pickConfig)
    const prevGroup = nextAll[groupId] ?? this.createNewEmptyPickConfig()
    nextAll[groupId] = _.mergeWith(prevGroup, config, (a, b) => (Array.isArray(a) ? b : undefined))
    this.pickConfig = nextAll
  }

  setBanConfig(groupId: string, config: DeepPartialObject<BanChampionConfig>) {
    const nextAll = _.cloneDeep(this.banConfig)
    const prevGroup = nextAll[groupId] ?? this.createNewEmptyBanConfig()
    nextAll[groupId] = _.mergeWith(prevGroup, config, (a, b) => (Array.isArray(a) ? b : undefined))
    this.banConfig = nextAll
  }

  constructor() {
    makeAutoObservable(this, {
      pickConfig: observable.ref,
      banConfig: observable.ref
    })
  }
}

export class AutoSelectState {
  get groups() {
    return this._remoteConfigState.autoSelectGroups.groups
  }

  temporarilyDisabled = false

  get csSession() {
    return this._leagueClientData.champSelect.session
  }

  get gfSession() {
    return this._leagueClientData.gameflow.session
  }

  get inChampSelect() {
    return Boolean(this.csSession)
  }

  get chatId() {
    return this._leagueClientData.chat.conversations.championSelect?.id || null
  }

  get inBanPickPhase() {
    return this.csSession?.timer.phase === 'BAN_PICK'
  }

  get inFinalizationPhase() {
    return this.csSession?.timer.phase === 'FINALIZATION'
  }

  get isPlanningPhase() {
    return this.csSession?.timer.phase === 'PLANNING'
  }

  get benchEnabled() {
    return this.csSession?.benchEnabled
  }

  get allowSubsetChampionPicks() {
    return this.csSession?.allowSubsetChampionPicks
  }

  get allowDuplicatePicks() {
    return this.csSession?.allowDuplicatePicks
  }

  get isCustomGame() {
    return this.gfSession?.gameData.isCustomGame || this.csSession?.isCustomGame || false
  }

  get timer() {
    return this.csSession?.timer || null
  }

  /** 经过校准后的 timer */
  get correctedTimer() {
    return getCorrectedTimer(this.timer)
  }

  get benchChampions() {
    return this.csSession?.benchChampions || []
  }

  /**
   * 当前可见的可自动选择用的列表
   */
  get scopedBenchChampions() {
    return getScopedBenchChampions({
      subsetChampionList: this.subsetChampionList,
      timer: this.timer,
      benchChampions: this.benchChampions
    })
  }

  get ongoingChampionSwap() {
    return this._leagueClientData.champSelect.ongoingChampionSwap
  }

  get myTeam() {
    if (!this.csSession) {
      return null
    }

    return this.csSession.myTeam
  }

  get trades() {
    if (!this.csSession) {
      return null
    }

    return this.csSession.trades
  }

  get myTeamSlotChampions() {
    return (
      this.myTeam?.map((m) => ({
        cellId: m.cellId,
        championId: m.championId
      })) || []
    )
  }

  /**
   * 当前正在进行的且属于该玩家的动作集合
   */
  get currentActions() {
    return getCurrentActions(this.csSession)
  }

  /**
   * 当前正在进行的 action (理论来说只有 1 个)
   */
  get activeAction() {
    return getActiveAction(this.currentActions)
  }

  get isPickingNow() {
    return this.activeAction?.type === 'pick'
  }

  get isBanningNow() {
    return this.activeAction?.type === 'ban'
  }

  get isVotingNow() {
    return this.activeAction?.type === 'vote'
  }

  get member() {
    return (
      this.csSession?.myTeam.find((m) => m.cellId === this.csSession?.localPlayerCellId) || null
    )
  }

  get assignedPosition() {
    return this.member?.assignedPosition || null
  }

  /**
   * 是否存在还没有完成的 pick，用于指示是否可以进行预选
   */
  get firstUnfinishedPickAction() {
    return getFirstUnfinishedPickAction(this.csSession)
  }

  /**
   * 当此为真时, 位于显式的预选阶段
   *
   * 但不仅于此, 在未完成任何英雄选择, 且不是正在 pick 或 ban 的时候, 预选操作仍然有效
   */
  get isPickIntenting() {
    return (
      this.isPlanningPhase ||
      (this.firstUnfinishedPickAction && !this.isPickingNow && !this.isBanningNow)
    )
  }

  get subsetChampionList() {
    return this._leagueClientData.lobbyTeamBuilder.champSelect.subsetChampionList
  }

  get currentBannableChampionIds() {
    return this._leagueClientData.champSelect.currentBannableChampionIds
  }

  get currentPickableChampionIds() {
    return this._leagueClientData.champSelect.currentPickableChampionIds
  }

  get gameMode() {
    return this._leagueClientData.gameflow.session?.gameData.queue.gameMode || null
  }

  get queueType() {
    return this._leagueClientData.gameflow.session?.gameData.queue.type || null
  }

  get currentSessionChampionId() {
    return getCurrentSessionChampionId(this.csSession)
  }

  /**
   * 当前模式下正在激活的配置组
   */
  get activeGroupConfig() {
    return getActiveGroupConfig({
      groups: this.groups,
      gameMode: this.gameMode,
      queueType: this.queueType,
      isCustomGame: this.isCustomGame,
      temporarilyDisabled: this.temporarilyDisabled,
      settings: this._settings
    })
  }

  get activeGroupConfigId() {
    return this.activeGroupConfig?.groupId || null
  }

  /**
   * 目前阶段**可以**进行的操作集合
   *
   *
   * - pick-intent: 可以进行预选
   *
   * **常规模式相关 - 选用**
   * - show-pick: 亮出当前要 pick 的英雄
   * - complete-pick: 锁定当前要 pick 的英雄
   *
   * **常规模式相关 - 禁用**
   * - show-ban: 亮出当前要 ban 的英雄
   * - complete-ban: 锁定当前要 ban 的英雄
   *
   * **克隆作战模式相关 - 投票 (需要进一步信息)**
   * - vote: 可以进行投票
   *
   * **乱斗 / 任何带备战席的模式 - 新版选卡机制**
   * - subset-pick: 可以进行 subset 中的选择
   * - complete-subset-pick: 锁定当前 subset 中的选择 (仅可通过 API 实现此状态)
   * - subset-bench-swap: 可以进行 subset 中的 swap
   * - bench-swap: 可以进行 swap
   */
  get move() {
    return getMove({
      isPickIntenting: this.isPickIntenting,
      activeAction: this.activeAction,
      isPickingNow: this.isPickingNow,
      isBanningNow: this.isBanningNow,
      isVotingNow: this.isVotingNow,
      allowSubsetChampionPicks: this.allowSubsetChampionPicks,
      benchEnabled: this.benchEnabled,
      currentSessionChampionId: this.currentSessionChampionId,
      timer: this.timer
    })
  }

  /**
   * 在预期英雄候选列表中的英雄
   *
   * 包括其可选用性
   */
  get expectedPicks() {
    return getExpectedPicks({
      activeGroupConfig: this.activeGroupConfig,
      assignedPosition: this.assignedPosition,
      gameMode: this.gameMode,
      gridChampions: this._leagueClientData.champSelect.gridChampions,
      currentPickableChampionIds: this.currentPickableChampionIds,
      allowDuplicatePicks: this.allowDuplicatePicks,
      allowSubsetChampionPicks: this.allowSubsetChampionPicks,
      subsetChampionList: this.subsetChampionList
    })
  }

  /**
   * 当前可以 swap 的英雄
   */
  get expectedSwaps() {
    return getExpectedSwaps({
      activeGroupConfig: this.activeGroupConfig,
      benchEnabled: this.benchEnabled,
      scopedBenchChampions: this.scopedBenchChampions,
      assignedPosition: this.assignedPosition,
      currentPickableChampionIds: this.currentPickableChampionIds,
      allowSubsetChampionPicks: this.allowSubsetChampionPicks,
      inBanPickPhase: this.inBanPickPhase,
      subsetChampionList: this.subsetChampionList
    })
  }

  /**
   * 在预期英雄候选列表中的英雄
   *
   * 包括其可禁用性
   */
  get expectedBans() {
    return getExpectedBans({
      activeGroupConfig: this.activeGroupConfig,
      assignedPosition: this.assignedPosition,
      gridChampions: this._leagueClientData.champSelect.gridChampions,
      currentBannableChampionIds: this.currentBannableChampionIds
    })
  }

  /**
   * 表示当前存在一个延迟的 ban 操作
   *
   * 被读取，或仅被自动禁用相关的 reaction 写入
   */
  delayedBanTask: DelayedBanPick | null = null

  /** 仅被读取的副本 */
  get delayedBan() {
    if (this.delayedBanTask) {
      const { timerId, ...rest } = this.delayedBanTask
      return rest
    }

    return null
  }

  /**
   * 表示当前存在一个延迟的 pick 操作
   *
   * 被读取，或仅被自动禁用相关的 reaction 写入
   */
  delayedPickTask: DelayedBanPick | null = null

  /** 仅被读取的副本 */
  get delayedPick() {
    if (this.delayedPickTask) {
      const { timerId, ...rest } = this.delayedPickTask
      return rest
    }

    return null
  }

  /**
   * 准备 swap 哪个英雄
   */
  delayedBenchSwapTask: DelayedBenchSwap | null = null

  /** 仅被读取的副本 */
  get delayedBenchSwap() {
    if (this.delayedBenchSwapTask) {
      const { timerId, ...rest } = this.delayedBenchSwapTask
      return rest
    }

    return null
  }

  /**
   * 交易 trade 的 champion swap
   */
  delayedChampionSwapTask: DelayedChampionSwap | null = null

  /** 仅被读取的副本 */
  get delayedChampionSwap() {
    if (this.delayedChampionSwapTask) {
      const { timerId, ...rest } = this.delayedChampionSwapTask
      return rest
    }

    return null
  }

  /**
   * trade 创建的时间
   *
   * trade 的创建没有基准时间的获取方法，因此需要进行手动记录
   *
   * P.S. 客户端 ux 实现是 15000ms 固定值 + 200ms / 700ms 的动画延迟
   */
  ongoingChampionSwapCreatedAt: number | null = null

  setTemporarilyDisabled(value: boolean) {
    this.temporarilyDisabled = value
  }

  setDelayedBan(config: DelayedBanPick | null) {
    this.delayedBanTask = config
  }

  setDelayedPick(config: DelayedBanPick | null) {
    this.delayedPickTask = config
  }

  setDelayedBenchSwap(config: DelayedBenchSwap | null) {
    this.delayedBenchSwapTask = config
  }

  setDelayedChampionSwap(config: DelayedChampionSwap | null) {
    this.delayedChampionSwapTask = config
  }

  setOngoingChampionSwapCreatedAt(value: number | null) {
    this.ongoingChampionSwapCreatedAt = value
  }

  constructor(
    private readonly _leagueClientData: LeagueClientData,
    private readonly _settings: AutoSelectSettings,
    private readonly _remoteConfigState: RemoteConfigState
  ) {
    makeAutoObservable(this, {
      // activeGroupConfig: computed.struct, // no need to set it structurally equals
      activeAction: computed.struct,
      currentActions: computed.struct,
      expectedPicks: computed.struct,
      expectedBans: computed.struct,
      expectedSwaps: computed.struct,

      correctedTimer: computed.struct,
      benchChampions: computed.struct,
      scopedBenchChampions: computed.struct,

      delayedBanTask: observable.struct,
      delayedPickTask: observable.struct,
      delayedBenchSwapTask: observable.struct,
      delayedChampionSwapTask: observable.struct
    })
  }
}
