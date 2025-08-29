import { Action } from '@shared/types/league-client/champ-select'
import { DeepPartialObject } from '@shared/utils/types'
import _ from 'lodash'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'
import { GROUPS } from './groups'

export type AutoPickStrategy = 'show' | 'lock-in' | 'show-and-delay-lock-in' // deprecated
export type AutoPickBanStrategy = 'just-show' | 'lock-in' | 'show-and-lock-in'

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
  ignoreIntent: boolean
}

export interface DelayedBanPick {
  completed: boolean
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
  timerId: NodeJS.Timeout
}

export class AutoSelectSettings {
  normalModeEnabled: boolean = false
  expectedChampions: Record<string, number[]> = {
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    utility: [],
    default: []
  }
  selectTeammateIntendedChampion: boolean = false
  showIntent: boolean = false
  pickStrategy: AutoPickStrategy = 'lock-in'
  lockInDelaySeconds: number = 0
  benchModeEnabled: boolean = false
  benchSelectFirstAvailableChampion: boolean = false
  benchHandleTradeEnabled: boolean = false
  benchExpectedChampions: number[] = []
  grabDelaySeconds: number = 2.9
  banEnabled: boolean = false
  banDelaySeconds: number = 0
  bannedChampions: Record<string, number[]> = {
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    utility: [],
    default: []
  }
  banTeammateIntendedChampion: boolean = false

  // --- new ---
  // modeTypeKey, configObject
  pickConfig: Record<string, PickChampionConfig> = {}
  banConfig: Record<string, BanChampionConfig> = {}

  setNormalModeEnabled(value: boolean) {
    this.normalModeEnabled = value
  }

  setExpectedChampions(value: Record<string, number[]>) {
    this.expectedChampions = value
  }

  setSelectTeammateIntendedChampion(value: boolean) {
    this.selectTeammateIntendedChampion = value
  }

  setShowIntent(value: boolean) {
    this.showIntent = value
  }

  setLockInDelaySeconds(value: number) {
    this.lockInDelaySeconds = value
  }

  setBenchModeEnabled(value: boolean) {
    this.benchModeEnabled = value
  }

  setBenchExpectedChampions(value: number[]) {
    this.benchExpectedChampions = value
  }

  setGrabDelaySeconds(value: number) {
    this.grabDelaySeconds = value
  }

  setBenchSelectFirstAvailableChampion(value: boolean) {
    this.benchSelectFirstAvailableChampion = value
  }

  setBanEnabled(value: boolean) {
    this.banEnabled = value
  }

  setBanDelaySeconds(value: number) {
    this.banDelaySeconds = value
  }

  setBannedChampions(value: Record<string, number[]>) {
    this.bannedChampions = value
  }

  setBanTeammateIntendedChampion(value: boolean) {
    this.banTeammateIntendedChampion = value
  }

  setBenchHandleTradeEnabled(value: boolean) {
    this.benchHandleTradeEnabled = value
  }

  setPickStrategy(value: AutoPickStrategy) {
    this.pickStrategy = value
  }

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
      showIntent: false,
      delaySeconds: 0,
      ignoreIntent: false,
      strategy: 'lock-in',
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
      ignoreIntent: false,
      delaySeconds: 0,
      strategy: 'lock-in'
    }
  }

  setPickConfig(groupId: string, config: DeepPartialObject<PickChampionConfig>) {
    const base = this.pickConfig?.[groupId] ?? this.createNewEmptyPickConfig()
    const nextType = _.mergeWith(base, config, (a, b) => (Array.isArray(a) ? b : undefined))

    this.pickConfig = {
      ...this.pickConfig,
      [groupId]: nextType
    }
  }

  setBanConfig(groupId: string, config: DeepPartialObject<BanChampionConfig>) {
    const base = this.banConfig?.[groupId] ?? this.createNewEmptyBanConfig()
    const nextType = _.mergeWith(base, config, (a, b) => (Array.isArray(a) ? b : undefined))

    this.banConfig = {
      ...this.banConfig,
      [groupId]: nextType
    }
  }

  constructor() {
    makeAutoObservable(this, {
      benchExpectedChampions: observable.struct,
      expectedChampions: observable.struct,
      bannedChampions: observable.struct,
      pickConfig: observable.ref,
      banConfig: observable.ref
    })
  }
}

export class AutoSelectState {
  groups = GROUPS

  temporaryDisabled = false

  get csSession() {
    return this._lcData.champSelect.session
  }

  get champSelectActionInfo() {
    if (
      !this._lcData.champSelect.session ||
      !this._lcData.champSelect.selfSummoner ||
      !this._lcData.gameflow.session
    ) {
      return null
    }

    const memberMe = this._lcData.champSelect.session.myTeam.find(
      (p) => p.cellId === this._lcData.champSelect.session?.localPlayerCellId
    )

    if (!memberMe) {
      return null
    }

    const result = this._lcData.champSelect.session.actions
      .map((arr) => {
        return arr.filter((a) => a.actorCellId === memberMe.cellId)
      })
      .filter((arr) => arr.length)

    const pickArr: Action[] = []
    for (const x of result) {
      for (const xx of x) {
        if (xx.type === 'pick') {
          pickArr.push(xx)
        }
      }
    }

    const banArr: Action[] = []
    for (const x of result) {
      for (const xx of x) {
        if (xx.type === 'ban') {
          banArr.push(xx)
        }
      }
    }

    return {
      pick: pickArr,
      ban: banArr,
      session: this._lcData.champSelect.session,
      gameMode: this._lcData.gameflow.session.gameData.queue.gameMode,
      memberMe,
      isActingNow: this._lcData.champSelect.selfSummoner.isActingNow,
      currentPickables: this._lcData.champSelect.currentPickableChampionIds,
      currentBannables: this._lcData.champSelect.currentBannableChampionIds,
      disabledChampions: this._lcData.champSelect.disabledChampionIds
    }
  }

  get memberMe() {
    if (!this.champSelectActionInfo) {
      return null
    }

    return this.champSelectActionInfo.memberMe
  }

  get targetPick() {
    if (!this._settings.normalModeEnabled) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a) {
      return null
    }

    // in bench mode, handle it in another way
    // so we don't need to do anything here
    if (a.session.benchEnabled) {
      return null
    }

    if (!a.pick.length) {
      return null
    }

    // 第一个能用的 action
    const first = a.pick.find((e) => !e.completed)

    if (!first) {
      return null
    }

    const mandatoryPickables: number[] = []
    const unpickables = new Set<number>()

    if (a.gameMode === 'CHERRY') {
      mandatoryPickables.push(CHEERY_BRAVERY_ID)
    }

    // 不能选择队友亮出的英雄, 以及自己已选定的英雄
    ;[...a.session.myTeam, ...a.session.theirTeam].forEach((t) => {
      // bravery in arena mode could be picked multiple times
      if (!t.championId) {
        return
      }

      if (t.puuid === a.memberMe.puuid) {
        if (first.championId === t.championId && first.completed) {
          unpickables.add(t.championId)
        }
      } else {
        unpickables.add(t.championId)
      }
    })

    // 不允许重复选择时，场上已经选择的英雄不能选择
    if (!a.session.allowDuplicatePicks) {
      a.session.actions.forEach((arr) => {
        arr.forEach((ac) => {
          if (ac.completed) {
            unpickables.add(ac.championId)
          }
        })
      })
    }

    // 不能选择当前已经禁用完毕的英雄
    a.session.actions.forEach((arr) =>
      arr.forEach((a) => {
        if (a.type === 'ban' && a.completed) {
          unpickables.add(a.championId)
        }
      })
    )

    // 不能选用队友已经预选的英雄，不考虑自己的预选
    if (!this._settings.selectTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unpickables.add(m.championPickIntent)
        }
      })
    }

    // 不能选用已经被禁用的英雄 (兼容性)
    ;[...a.session.bans.myTeamBans, ...a.session.bans.theirTeamBans].forEach((c) =>
      unpickables.add(c)
    )

    let expectedChampions: number[]
    if (a.memberMe.assignedPosition) {
      const preset = this._settings.expectedChampions[a.memberMe.assignedPosition] || []
      expectedChampions = [...preset, ...this._settings.expectedChampions.default]
    } else {
      expectedChampions = this._settings.expectedChampions.default
    }

    const pickables = expectedChampions.filter(
      (c) =>
        (!unpickables.has(c) && a.currentPickables.has(c) && !a.disabledChampions.has(c)) ||
        mandatoryPickables.includes(c)
    )

    if (!pickables.length) {
      return null
    }

    return {
      championId: pickables[0],
      isActingNow: a.isActingNow,
      action: {
        id: first.id,
        isInProgress: first.isInProgress,
        completed: first.completed
      }
    }
  }

  get targetBan() {
    if (!this._settings.banEnabled) {
      return null
    }

    const a = this.champSelectActionInfo

    if (!a) {
      return null
    }

    // in bench mode, we handle it in another way
    // same as targetPick
    if (a.session.benchEnabled) {
      return null
    }

    if (!a.ban.length) {
      return null
    }

    const first = a.ban.find((e) => !e.completed)

    if (!first) {
      return null
    }

    const unbannables = new Set<number>()

    // 已经禁用过的无需再 ban，空 ban 除外
    a.session.actions.forEach((arr) =>
      arr.forEach((a) => {
        if (a.type === 'ban' && a.completed && a.id !== -1) {
          unbannables.add(a.championId)
        }
      })
    )

    // 已经 ban 过的不用再 ban (兼容性)
    ;[...a.session.bans.myTeamBans, ...a.session.bans.theirTeamBans].forEach((t) => {
      unbannables.add(t)
    })

    // 不 ban 队友预选
    if (!this._settings.banTeammateIntendedChampion) {
      a.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.puuid !== a.memberMe.puuid) {
          unbannables.add(m.championPickIntent)
        }
      })
    }

    let bannedChampions: number[]
    if (a.memberMe.assignedPosition) {
      const preset = this._settings.bannedChampions[a.memberMe.assignedPosition] || []
      bannedChampions = [...preset, ...this._settings.bannedChampions.default]
    } else {
      bannedChampions = this._settings.bannedChampions.default
    }

    const bannables = bannedChampions.filter(
      (c) =>
        (c == -1 && !a.session.isCustomGame) ||
        (!unbannables.has(c) && a.currentBannables.has(c) && !a.disabledChampions.has(c))
    )

    if (!bannables.length) {
      return null
    }

    return {
      championId: bannables[0],
      isActingNow: a.isActingNow,
      action: {
        id: first.id,
        isInProgress: first.isInProgress,
        completed: first.completed
      }
    }
  }

  upcomingGrab: {
    championId: number
    willGrabAt: number
  } | null = null

  setUpcomingGrab(championId: number, at: number): void
  setUpcomingGrab(clear: null): void
  setUpcomingGrab(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingGrab = null
      return
    }

    this.upcomingGrab = {
      championId: arg1,
      willGrabAt: arg2!
    }
  }

  upcomingPick: {
    championId: number
    willPickAt: number
  } | null = null

  setUpcomingPick(championId: number, at: number): void
  setUpcomingPick(clear: null): void
  setUpcomingPick(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingPick = null
      return
    }

    this.upcomingPick = {
      championId: arg1,
      willPickAt: arg2!
    }
  }

  upcomingBan: {
    championId: number
    willBanAt: number
  } | null = null

  setUpcomingBan(championId: number, at: number): void
  setUpcomingBan(clear: null): void
  setUpcomingBan(arg1: number | null, arg2?: number): void {
    if (arg1 === null) {
      this.upcomingBan = null
      return
    }

    this.upcomingBan = {
      championId: arg1,
      willBanAt: arg2!
    }
  }

  // --- new

  // champ-select session computed
  get inBanPickPhase() {
    return this.csSession?.timer.phase === 'BAN_PICK'
  }

  get inFinalizationPhase() {
    return this.csSession?.timer.phase === 'FINALIZATION'
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
    return this.csSession?.isCustomGame || false
  }

  get timer() {
    return this.csSession?.timer || null
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
  get hasUnfinishedPickAction() {
    const session = this.csSession

    if (!session) {
      return []
    }

    return session.actions
      .flat()
      .filter((a) => a.actorCellId === session.localPlayerCellId)
      .some((a) => a.type === 'pick' && !a.completed)
  }

  /**
   * 当此为真时, 位于显式的预选阶段
   *
   * 但不仅于此, 在未完成任何英雄选择, 且不是正在 pick 或 ban 的时候, 预选操作仍然有效
   */
  get isPickIntenting() {
    if (!this.csSession) {
      return false
    }

    return (
      this.csSession.timer.phase === 'PLANNING' ||
      (this.hasUnfinishedPickAction && !this.isPickingNow && !this.isBanningNow)
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

  /**
   * 当前模式下正在激活的配置组
   */
  get activeGroupConfig() {
    if (!this.gameMode || !this.queueType) {
      return
    }

    const suitableGameModeGroups = this.groups.filter((g) => g.targetGameMode === this.gameMode)

    if (suitableGameModeGroups.length === 0) {
      return null
    } else if (suitableGameModeGroups.length === 1) {
      const thatGroup = suitableGameModeGroups[0].groupId

      return {
        groupId: thatGroup,
        temporaryDisabled: this.temporaryDisabled,
        pick: this._settings.pickConfig[thatGroup] || this._settings.createNewEmptyPickConfig(),
        ban: this._settings.banConfig[thatGroup] || this._settings.createNewEmptyBanConfig()
      }
    }

    // 为了未来可用性 (虽然... 可能不会用到)
    const scores: Record<string, number> = {}
    for (const group of suitableGameModeGroups) {
      if (!scores[group.groupId]) {
        scores[group.groupId] = 0
      }

      if (group.targetQueueTypes === null) {
        scores[group.groupId] += 10
      } else if (group.targetQueueTypes.includes(this.queueType)) {
        scores[group.groupId] += 100
      }
    }

    const winner = Object.entries(scores).toSorted(([_cia, a], [_llo, b]) => b - a)[0][0]

    return {
      groupId: winner,
      temporaryDisabled: this.temporaryDisabled,
      pick: this._settings.pickConfig[winner] || this._settings.createNewEmptyPickConfig(),
      ban: this._settings.banConfig[winner] || this._settings.createNewEmptyBanConfig
    }
  }

  /**
   * 目前阶段**可以**进行的操作集合
   *
   *
   * - pick-intent: 可以进行预选
   *
   * **常规模式相关 - 选用**
   * - draft-pick: 亮出当前要 pick 的英雄
   * - complete-pick: 锁定当前要 pick 的英雄
   *
   * **常规模式相关 - 禁用**
   * - draft-ban: 亮出当前要 ban 的英雄
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
        return championShown ? 'complete-subset-pick' : 'subset-pick'
      } else {
        return championShown ? 'complete-pick' : 'draft-pick'
      }
    }

    if (this.isBanningNow) {
      return championShown ? 'complete-ban' : 'draft-ban'
    }

    if (this.isVotingNow) {
      return 'vote'
    }

    // 带有备战席的模式，在选用英雄后可以 swap
    // 但在 subset pick 阶段，只能 swap 位于自己 subset 中的英雄
    // 只有自己有英雄的时候才能 swap，毕竟是 swap
    // 如果是抽卡模式的选用，则区分仅仅可 swap subset 中的情况
    if (this.benchEnabled && this._lcData.champSelect.currentChampion) {
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
  delayedBan: DelayedBanPick | null = null

  /**
   * 表示当前存在一个延迟的 pick 操作
   *
   * 被读取，或仅被自动禁用相关的 reaction 写入
   */
  delayedPick: DelayedBanPick | null = null

  setTemporaryDisabled(value: boolean) {
    this.temporaryDisabled = value
  }

  setDelayedBan(config: DelayedBanPick | null) {
    this.delayedBan = config
  }

  setDelayedPick(config: DelayedBanPick | null) {
    this.delayedPick = config
  }

  constructor(
    private readonly _lcData: LeagueClientData,
    private readonly _settings: AutoSelectSettings
  ) {
    makeAutoObservable(this, {
      targetBan: computed.struct,
      targetPick: computed.struct,
      memberMe: computed.struct,
      upcomingGrab: observable.struct,
      upcomingPick: observable.struct,
      upcomingBan: observable.struct,

      activeGroupConfig: computed.struct,
      activeAction: computed.struct,
      currentActions: computed.struct,
      expectedPicks: computed.struct,
      expectedBans: computed.struct,

      timer: computed.struct,

      delayedBan: observable.struct,
      delayedPick: observable.struct,

      groups: observable.ref
    })
  }
}
