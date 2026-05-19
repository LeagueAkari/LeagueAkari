import type { AutoSelectGroup } from '@shared/schemas/remote-config'
import type {
  Action,
  BenchChampion,
  ChampSelectSession,
  GridChamp,
  Timer
} from '@shared/types/league-client/champ-select'
import type { ExpectedChampionStatus } from '@shared/types/shards/auto-select'

import type { AutoSelectSettings, BanChampionConfig, PickChampionConfig } from './state'

const NONE_CHAMPION_ID = -1
const CHEERY_BRAVERY_ID = -3

export type CorrectedTimer = {
  remainingMs: number
  totalMs: number
  elapsedMs: number
}

export type ActiveGroupConfig = {
  groupId: string
  temporarilyDisabled: boolean
  pick: PickChampionConfig
  ban: BanChampionConfig
}

export type AutoSelectMove =
  | 'pick-intent'
  | 'show-pick'
  | 'complete-pick'
  | 'show-ban'
  | 'complete-ban'
  | 'vote'
  | 'show-subset-pick'
  | 'complete-subset-pick'
  | 'subset-bench-swap'
  | 'bench-swap'

export function getCorrectedTimer(timer: Timer | null | undefined): CorrectedTimer | null {
  if (!timer) {
    return null
  }

  if (timer.isInfinite) {
    return null
  }

  const remainingMs = timer.adjustedTimeLeftInPhase - (Date.now() - timer.internalNowInEpochMs)
  const totalMs = timer.totalTimeInPhase
  const elapsedMs = totalMs - remainingMs

  return {
    remainingMs,
    totalMs,
    elapsedMs
  }
}

export function getScopedBenchChampions(args: {
  subsetChampionList: number[]
  timer: Timer | null | undefined
  benchChampions: BenchChampion[]
}) {
  const { subsetChampionList, timer, benchChampions } = args

  if (subsetChampionList.length && timer?.phase === 'BAN_PICK') {
    return subsetChampionList
  }

  return benchChampions.map((c) => c.championId)
}

export function getCurrentActions(session: ChampSelectSession | null | undefined): Action[] {
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

export function getActiveAction(currentActions: Action[]): Action | null {
  return currentActions.find((a) => !a.completed) || null
}

export function getFirstUnfinishedPickAction(
  session: ChampSelectSession | null | undefined
): Action | null {
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

export function getCurrentSessionChampionId(
  session: ChampSelectSession | null | undefined
): number | null {
  if (!session) {
    return null
  }

  return session.myTeam.find((m) => m.cellId === session.localPlayerCellId)?.championId || null
}

export function getActiveGroupConfig(args: {
  groups: AutoSelectGroup[]
  gameMode: string | null
  queueType: string | null
  isCustomGame: boolean
  temporarilyDisabled: boolean
  settings: AutoSelectSettings
}): ActiveGroupConfig | null | undefined {
  const { groups, gameMode, queueType, isCustomGame, temporarilyDisabled, settings } = args

  if (!gameMode || !queueType) {
    return
  }

  const firstGroup = groups.find((g) => {
    return (
      g.isCustom === isCustomGame &&
      g.targetGameModes.some((gm) => {
        return (
          gm.gameMode === gameMode && gm.queueTypes.some((qt) => qt === '*' || qt === queueType)
        )
      })
    )
  })

  if (firstGroup) {
    const thatGroup = firstGroup.groupId

    return {
      groupId: thatGroup,
      temporarilyDisabled,
      pick: settings.pickConfig[thatGroup] || settings.createNewEmptyPickConfig(),
      ban: settings.banConfig[thatGroup] || settings.createNewEmptyBanConfig()
    }
  } else {
    return null
  }
}

export function getMove(args: {
  isPickIntenting: boolean | null
  activeAction: Action | null
  isPickingNow: boolean
  isBanningNow: boolean
  isVotingNow: boolean
  allowSubsetChampionPicks: boolean | undefined
  benchEnabled: boolean | undefined
  currentSessionChampionId: number | null
  timer: Timer | null | undefined
}): AutoSelectMove | null {
  const {
    isPickIntenting,
    activeAction,
    isPickingNow,
    isBanningNow,
    isVotingNow,
    allowSubsetChampionPicks,
    benchEnabled,
    currentSessionChampionId,
    timer
  } = args

  if (isPickIntenting) {
    return 'pick-intent'
  }

  const championShown = Boolean(activeAction?.championId)

  if (isPickingNow) {
    // 区分是抽卡型选人，还是正常选择选人
    // 两种不同情况，可以选择的卡池不同。前者只运行在 subset 中选择 (1 ~ 3 个英雄)
    if (allowSubsetChampionPicks) {
      return championShown ? 'complete-subset-pick' : 'show-subset-pick'
    } else {
      return championShown ? 'complete-pick' : 'show-pick'
    }
  }

  if (isBanningNow) {
    return championShown ? 'complete-ban' : 'show-ban'
  }

  if (isVotingNow) {
    return 'vote'
  }

  // 带有备战席的模式，在选用英雄后可以 swap
  // 但在 subset pick 阶段，只能 swap 位于自己 subset 中的英雄
  // 只有自己有英雄的时候才能 swap，毕竟是 swap
  // 如果是抽卡模式的选用，则区分仅仅可 swap subset 中的情况
  if (benchEnabled && currentSessionChampionId) {
    if (allowSubsetChampionPicks && timer?.phase === 'BAN_PICK') {
      return 'subset-bench-swap'
    }

    return 'bench-swap'
  }

  return null
}

export function getExpectedPicks(args: {
  activeGroupConfig: ActiveGroupConfig | null | undefined
  assignedPosition: string | null
  gameMode: string | null
  gridChampions: Record<number, GridChamp>
  currentPickableChampionIds: Set<number>
  allowDuplicatePicks: boolean | undefined
  allowSubsetChampionPicks: boolean | undefined
  subsetChampionList: number[]
}): ExpectedChampionStatus[] | null {
  const {
    activeGroupConfig,
    assignedPosition,
    gameMode,
    gridChampions,
    currentPickableChampionIds,
    allowDuplicatePicks,
    allowSubsetChampionPicks,
    subsetChampionList
  } = args

  if (!activeGroupConfig) {
    return null
  }

  const pick = activeGroupConfig.pick.champions[assignedPosition || 'default'] || []

  return pick.map((c) => {
    // 特别地，勇敢举动作为不存在的英雄，需要硬编码处理 (正如 rcp 中一样)
    if (c === CHEERY_BRAVERY_ID && gameMode === 'CHERRY') {
      return { id: c, status: 'pickable' }
    }

    const grid = gridChampions[c]

    // 高度依赖此状态，因此为空会不采用此英雄
    if (!grid) {
      return { id: c, status: 'unknown' }
    }

    // 服务器硬性规定
    if (!currentPickableChampionIds.has(c)) {
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
    if (!allowDuplicatePicks) {
      // 被预选的时候，需要特别标明
      if (grid.selectionStatus.pickIntented && !grid.selectionStatus.pickIntentedByMe) {
        return { id: c, status: 'pick-intented' }
      }

      // 被他人选择的情况，在之前已经排除了 banned 的情况，所以此处一定是 picked
      if (grid.selectionStatus.pickedByOtherOrBanned && !grid.selectionStatus.selectedByMe) {
        return { id: c, status: 'picked' }
      }
    }

    if (allowSubsetChampionPicks) {
      if (subsetChampionList.includes(c)) {
        return { id: c, status: 'subset-pickable' }
      } else {
        return { id: c, status: 'unpickable' }
      }
    }

    return { id: c, status: 'pickable' }
  })
}

export function getExpectedSwaps(args: {
  activeGroupConfig: ActiveGroupConfig | null | undefined
  benchEnabled: boolean | undefined
  scopedBenchChampions: number[]
  assignedPosition: string | null
  currentPickableChampionIds: Set<number>
  allowSubsetChampionPicks: boolean | undefined
  inBanPickPhase: boolean
  subsetChampionList: number[]
}): ExpectedChampionStatus[] | null {
  const {
    activeGroupConfig,
    benchEnabled,
    scopedBenchChampions,
    assignedPosition,
    currentPickableChampionIds,
    allowSubsetChampionPicks,
    inBanPickPhase,
    subsetChampionList
  } = args

  if (!activeGroupConfig || !benchEnabled || !scopedBenchChampions.length) {
    return null
  }

  const pick = activeGroupConfig.pick.champions[assignedPosition || 'default'] || []

  return pick.map((c) => {
    if (!scopedBenchChampions.includes(c) || !currentPickableChampionIds.has(c)) {
      return { id: c, status: 'unswappable' }
    }

    if (allowSubsetChampionPicks && inBanPickPhase) {
      if (subsetChampionList.includes(c)) {
        return { id: c, status: 'subset-swappable' }
      } else {
        return { id: c, status: 'waiting-on-finalization' }
      }
    } else {
      return { id: c, status: 'swappable' }
    }
  })
}

export function getExpectedBans(args: {
  activeGroupConfig: ActiveGroupConfig | null | undefined
  assignedPosition: string | null
  gridChampions: Record<number, GridChamp>
  currentBannableChampionIds: Set<number>
}): ExpectedChampionStatus[] | null {
  const { activeGroupConfig, assignedPosition, gridChampions, currentBannableChampionIds } = args

  if (!activeGroupConfig) {
    return null
  }

  const ban = activeGroupConfig.ban.champions[assignedPosition || 'default'] || []

  return ban.map((c) => {
    const grid = gridChampions[c]

    // 高度依赖此状态，因此为空会不会考虑此英雄
    if (!grid) {
      return { id: c, status: 'unknown' }
    }

    // 服务器硬性规定，注意这个集合也包括 -1 (空 ban)，决定是否可以空 ban
    if (!currentBannableChampionIds.has(c)) {
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
