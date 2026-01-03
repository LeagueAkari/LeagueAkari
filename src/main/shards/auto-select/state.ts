import { DeepPartialObject } from '@shared/utils/types'
import _ from 'lodash'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'
import { GROUPS } from './groups'

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
      benchSwapAccumulatedDelaySeconds: 1
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
  groups = GROUPS

  temporarilyDisabled = false

  get csSession() {
    return this._lcData.champSelect.session
  }

  get gfSession() {
    return this._lcData.gameflow.session
  }

  get inChampSelect() {
    return Boolean(this.csSession)
  }

  get chatId() {
    return this._lcData.chat.conversations.championSelect?.id || null
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

  get benchChampions() {
    return this.csSession?.benchChampions || []
  }

  /**
   * 当前可见的可自动选择用的列表
   */
  get scopedBenchChampions() {
    if (this.subsetChampionList.length && this.timer?.phase === 'BAN_PICK') {
      return this.subsetChampionList
    }

    return this.benchChampions.map((c) => c.championId)
  }

  get ongoingChampionSwap() {
    return this._lcData.champSelect.ongoingChampionSwap
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
    const session = this.csSession

    if (!session || !session.actions.length) {
      return []
    }

    const notAllCompletedActionsIndex = session.actions.findIndex((arr) => {
      return !arr.every((a) => a.completed)
    })

    if (notAllCompletedActionsIndex === -1) {
      return []
    }

    return session.actions[notAllCompletedActionsIndex].filter(
      (a) => a.actorCellId === session.localPlayerCellId
    )
  }

  /**
   * 当前正在进行的 action (理论来说只有 1 个)
   */
  get activeAction() {
    return this.currentActions.find((a) => !a.completed) || null
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
    const session = this.csSession

    if (!session) {
      return null
    }

    return (
      session.actions
        .flat()
        .filter((a) => a.actorCellId === session.localPlayerCellId)
        .find((a) => a.type === 'pick' && !a.completed) || null
    )
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
    return this._lcData.lobbyTeamBuilder.champSelect.subsetChampionList
  }

  get currentBannableChampionIds() {
    return this._lcData.champSelect.currentBannableChampionIds
  }

  get currentPickableChampionIds() {
    return this._lcData.champSelect.currentPickableChampionIds
  }

  get gameMode() {
    return this._lcData.gameflow.session?.gameData.queue.gameMode || null
  }

  get queueType() {
    return this._lcData.gameflow.session?.gameData.queue.type || null
  }

  get currentSessionChampionId() {
    if (!this.csSession) {
      return null
    }

    const session = this.csSession
    return session.myTeam.find((m) => m.cellId === session.localPlayerCellId)?.championId || null
  }

  /**
   * 当前模式下正在激活的配置组
   */
  get activeGroupConfig() {
    if (!this.gameMode || !this.queueType) {
      return
    }

    const firstGroup = this.groups.find((g) => {
      return (
        g.isCustom === this.isCustomGame &&
        g.targetGameModes.some((gm) => {
          return (
            gm.gameMode === this.gameMode! &&
            gm.queueTypes.some((qt) => qt === '*' || qt === this.queueType!)
          )
        })
      )
    })

    if (firstGroup) {
      const thatGroup = firstGroup.groupId

      return {
        groupId: thatGroup,
        temporarilyDisabled: this.temporarilyDisabled,
        pick: this._settings.pickConfig[thatGroup] || this._settings.createNewEmptyPickConfig(),
        ban: this._settings.banConfig[thatGroup] || this._settings.createNewEmptyBanConfig()
      }
    } else {
      return null
    }
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
    if (this.isPickIntenting) {
      return 'pick-intent'
    }

    const championShown = Boolean(this.activeAction?.championId)

    if (this.isPickingNow) {
      // 区分是抽卡型选人，还是正常选择选人
      // 两种不同情况，可以选择的卡池不同。前者只运行在 subset 中选择 (1 ~ 3 个英雄)
      if (this.allowSubsetChampionPicks) {
        return championShown ? 'complete-subset-pick' : 'show-subset-pick'
      } else {
        return championShown ? 'complete-pick' : 'show-pick'
      }
    }

    if (this.isBanningNow) {
      return championShown ? 'complete-ban' : 'show-ban'
    }

    if (this.isVotingNow) {
      return 'vote'
    }

    // 带有备战席的模式，在选用英雄后可以 swap
    // 但在 subset pick 阶段，只能 swap 位于自己 subset 中的英雄
    // 只有自己有英雄的时候才能 swap，毕竟是 swap
    // 如果是抽卡模式的选用，则区分仅仅可 swap subset 中的情况
    if (this.benchEnabled && this.currentSessionChampionId) {
      if (this.allowSubsetChampionPicks && this.timer?.phase === 'BAN_PICK') {
        return 'subset-bench-swap'
      }

      return 'bench-swap'
    }

    return null
  }

  /**
   * 在预期英雄候选列表中的英雄
   *
   * 包括其可选用性
   */
  get expectedPicks() {
    if (!this.activeGroupConfig) {
      return null
    }

    const config = this.activeGroupConfig
    const pick = config.pick.champions[this.assignedPosition || 'default'] || []

    return pick.map((c) => {
      // 特别地，勇敢举动作为不存在的英雄，需要硬编码处理 (正如 rcp 中一样)
      if (c === CHEERY_BRAVERY_ID && this.gameMode === 'CHERRY') {
        return { id: c, status: 'pickable' }
      }

      const grid = this._lcData.champSelect.gridChampions[c]

      // 高度依赖此状态，因此为空会不采用此英雄
      if (!grid) {
        return { id: c, status: 'unknown' }
      }

      // 服务器硬性规定
      if (!this.currentPickableChampionIds.has(c)) {
        // 细分情况 - 未拥有
        if (!grid.owned) {
          return { id: c, status: 'not-owned' }
        }

        return { id: c, status: 'unpickable' }
      }

      // 被禁用，无条件不可选
      if (grid.selectionStatus.isBanned) {
        return { id: c, status: 'banned' }
      }

      // 仅在不可重复选择时考虑多种冲突情况
      if (!this.allowDuplicatePicks) {
        // 被预选的时候，需要特别标明
        if (grid.selectionStatus.pickIntented && !grid.selectionStatus.pickIntentedByMe) {
          return { id: c, status: 'pick-intented' }
        }

        // 被他人选择的情况，在之前已经排除了 banned 的情况，所以此处一定是 picked
        if (grid.selectionStatus.pickedByOtherOrBanned && !grid.selectionStatus.selectedByMe) {
          return { id: c, status: 'picked' }
        }
      }

      if (this.allowSubsetChampionPicks) {
        if (this.subsetChampionList.includes(c)) {
          return { id: c, status: 'subset-pickable' }
        } else {
          return { id: c, status: 'unpickable' }
        }
      }

      return { id: c, status: 'pickable' }
    })
  }

  /**
   * 当前可以 swap 的英雄
   */
  get expectedSwaps() {
    if (!this.activeGroupConfig || !this.benchEnabled || !this.scopedBenchChampions.length) {
      return null
    }

    const config = this.activeGroupConfig
    const pick = config.pick.champions[this.assignedPosition || 'default'] || []

    return pick.map((c) => {
      if (!this.scopedBenchChampions.includes(c) || !this.currentPickableChampionIds.has(c)) {
        return { id: c, status: 'unswappable' }
      }

      if (this.allowSubsetChampionPicks && this.inBanPickPhase) {
        if (this.subsetChampionList.includes(c)) {
          return { id: c, status: 'subset-swappable' }
        } else {
          return { id: c, status: 'waiting-on-finalization' }
        }
      } else {
        return { id: c, status: 'swappable' }
      }
    })
  }

  /**
   * 在预期英雄候选列表中的英雄
   *
   * 包括其可禁用性
   */
  get expectedBans() {
    if (!this.activeGroupConfig) {
      return null
    }

    const config = this.activeGroupConfig
    const ban = config.ban.champions[this.assignedPosition || 'default'] || []

    return ban.map((c) => {
      const grid = this._lcData.champSelect.gridChampions[c]

      // 高度依赖此状态，因此为空会不会考虑此英雄
      if (!grid) {
        return { id: c, status: 'unknown' }
      }

      // 服务器硬性规定，注意这个集合也包括 -1 (空 ban)，决定是否可以空 ban
      if (!this.currentBannableChampionIds.has(c)) {
        return { id: c, status: 'unbannable' }
      }

      // 被禁用，已经被 ban 了不能再 ban。但对于空 ban 来说，可以重复
      if (grid.selectionStatus.isBanned && c !== NONE_CHAMPION_ID) {
        return { id: c, status: 'banned' }
      }

      // 被预选的时候，需要特别标明
      if (grid.selectionStatus.pickIntented && !grid.selectionStatus.pickIntentedByMe) {
        return { id: c, status: 'pick-intented' }
      }

      return { id: c, status: 'bannable' }
    })
  }

  /**
   * 表示当前存在一个延迟的 ban 操作
   *
   * 被读取，或仅被自动禁用相关的 reaction 写入
   */
  _delayedBan: DelayedBanPick | null = null

  /** 仅被读取的副本 */
  get delayedBan() {
    if (this._delayedBan) {
      const { timerId, ...rest } = this._delayedBan
      return rest
    }

    return null
  }

  /**
   * 表示当前存在一个延迟的 pick 操作
   *
   * 被读取，或仅被自动禁用相关的 reaction 写入
   */
  _delayedPick: DelayedBanPick | null = null

  /** 仅被读取的副本 */
  get delayedPick() {
    if (this._delayedPick) {
      const { timerId, ...rest } = this._delayedPick
      return rest
    }

    return null
  }

  /**
   * 准备 swap 哪个英雄
   */
  _delayedBenchSwap: DelayedBenchSwap | null = null

  /** 仅被读取的副本 */
  get delayedBenchSwap() {
    if (this._delayedBenchSwap) {
      const { timerId, ...rest } = this._delayedBenchSwap
      return rest
    }

    return null
  }

  /**
   * 交易 trade 的 champion swap
   */
  _delayedChampionSwap: DelayedChampionSwap | null = null

  /** 仅被读取的副本 */
  get delayedChampionSwap() {
    if (this._delayedChampionSwap) {
      const { timerId, ...rest } = this._delayedChampionSwap
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
    this._delayedBan = config
  }

  setDelayedPick(config: DelayedBanPick | null) {
    this._delayedPick = config
  }

  setDelayedBenchSwap(config: DelayedBenchSwap | null) {
    this._delayedBenchSwap = config
  }

  setDelayedChampionSwap(config: DelayedChampionSwap | null) {
    this._delayedChampionSwap = config
  }

  setOngoingChampionSwapCreatedAt(value: number | null) {
    this.ongoingChampionSwapCreatedAt = value
  }

  constructor(
    private readonly _lcData: LeagueClientData,
    private readonly _settings: AutoSelectSettings
  ) {
    makeAutoObservable(this, {
      // activeGroupConfig: computed.struct, // no need to set it structurally equals
      activeAction: computed.struct,
      currentActions: computed.struct,
      expectedPicks: computed.struct,
      expectedBans: computed.struct,
      expectedSwaps: computed.struct,

      timer: computed.struct,
      benchChampions: computed.struct,
      scopedBenchChampions: computed.struct,

      _delayedBan: observable.struct,
      _delayedPick: observable.struct,
      _delayedBenchSwap: observable.struct,
      _delayedChampionSwap: observable.struct,

      groups: observable.ref
    })
  }
}
