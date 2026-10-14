import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import type { ChampSelectSession, ChampSelectTeam } from '@shared/types/league-client/champ-select'

/** 选人阶段已经出现的一名英雄, 连同客户端给它分配的分路。 */
export interface DraftChampSelectMember {
  championId: number

  /** 客户端分配的分路; 盲选这类不分配位置的模式里为 null */
  position: ChampionDataPosition | null

  /**
   * 是否为本机玩家。面板用本方英雄 (`selfChampionId`) 就能判出来, 这个字段主要是让
   * "本机玩家排在首位"这条约定可被断言, 而不是只能靠读代码相信。
   */
  isLocalPlayer: boolean
}

export interface DraftChampSelectSnapshot {
  /** 己方已锁定或已意向的英雄, 本机玩家恒定排在首位 */
  allyMembers: DraftChampSelectMember[]

  /** 敌方已锁定的英雄 */
  opponentMembers: DraftChampSelectMember[]

  /** 本方玩家当前锁定或意向的英雄, 尚未选择时为 null */
  selfChampionId: number | null

  /** 本方玩家的位置, 无法判定时为 null */
  selfPosition: ChampionDataPosition | null

  /** 场上是否已经出现可供参考的英雄 */
  actionable: boolean
}

export const EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT: DraftChampSelectSnapshot = {
  allyMembers: [],
  opponentMembers: [],
  selfChampionId: null,
  selfPosition: null,
  actionable: false
}

const POSITION_BY_LCU_VALUE: Readonly<Record<string, ChampionDataPosition>> = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'middle',
  MID: 'middle',
  BOTTOM: 'bottom',
  ADC: 'bottom',
  UTILITY: 'utility',
  SUPPORT: 'utility'
}

/**
 * LCU 的位置字段在不同队列与版本中并不统一 (例如 `ADC` 与 `BOTTOM`), 这里统一收敛为
 * 数据源的通用位置枚举。无法识别时返回 null, 而不是猜一个默认位置。
 */
export function toChampionDataPosition(
  raw: string | null | undefined
): ChampionDataPosition | null {
  if (!raw) {
    return null
  }

  return POSITION_BY_LCU_VALUE[raw.toUpperCase()] ?? null
}

function readAlliedChampionId(member: ChampSelectTeam) {
  // 己方能同时看到锁定结果与队友的预选意向, 意向对"推荐"同样有参考价值。
  return member.championId || member.championPickIntent || 0
}

function readOpposingChampionId(member: ChampSelectTeam) {
  // 敌方只会暴露锁定结果, 预选意向在对方锁定前不可见。
  return member.championId || 0
}

function collectMembers(
  members: readonly ChampSelectTeam[],
  read: (member: ChampSelectTeam) => number,
  localPlayerCellId: number
): DraftChampSelectMember[] {
  // 本机玩家恒定排首位：整个面板是围绕"我该选什么"展开的, 第一行永远应该是自己。
  const ordered = [...members].sort((left, right) => {
    if (left.cellId === right.cellId) {
      return 0
    }

    if (left.cellId === localPlayerCellId) {
      return -1
    }

    if (right.cellId === localPlayerCellId) {
      return 1
    }

    return left.cellId - right.cellId
  })

  const collected: DraftChampSelectMember[] = []

  for (const member of ordered) {
    const championId = read(member)

    if (championId <= 0 || collected.some((item) => item.championId === championId)) {
      continue
    }

    collected.push({
      championId,
      position: toChampionDataPosition(member.assignedPosition),
      isLocalPlayer: member.cellId === localPlayerCellId
    })
  }

  return collected
}

export function readDraftChampSelectSnapshot(
  session: ChampSelectSession | null | undefined
): DraftChampSelectSnapshot {
  if (!session) {
    return EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT
  }

  const myTeam = session.myTeam ?? []
  const theirTeam = session.theirTeam ?? []
  const localPlayerCellId = session.localPlayerCellId

  const allyMembers = collectMembers(myTeam, readAlliedChampionId, localPlayerCellId)
  const opponentMembers = collectMembers(theirTeam, readOpposingChampionId, localPlayerCellId)

  const self = myTeam.find((member) => member.cellId === localPlayerCellId) ?? null
  const selfChampionId = self ? self.championId || self.championPickIntent || 0 : 0

  return {
    allyMembers,
    opponentMembers,
    selfChampionId: selfChampionId > 0 ? selfChampionId : null,
    selfPosition: self ? toChampionDataPosition(self.assignedPosition) : null,
    actionable: allyMembers.length > 0 || opponentMembers.length > 0
  }
}
