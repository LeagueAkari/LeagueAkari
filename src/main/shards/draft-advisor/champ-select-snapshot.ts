import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import type { ChampSelectSession, ChampSelectTeam } from '@shared/types/league-client/champ-select'

export interface DraftChampSelectSnapshot {
  /** 己方已锁定或已意向的英雄 */
  allyChampionIds: number[]

  /** 敌方已锁定或已意向的英雄 */
  enemyChampionIds: number[]

  /** 本方玩家当前锁定或意向的英雄, 尚未选择时为 null */
  selfChampionId: number | null

  /** 本方玩家的位置, 无法判定时为 null */
  selfPosition: ChampionDataPosition | null

  /** 场上是否已经出现可供参考的英雄 */
  actionable: boolean
}

export const EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT: DraftChampSelectSnapshot = {
  allyChampionIds: [],
  enemyChampionIds: [],
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

function collectChampionIds(
  members: readonly ChampSelectTeam[],
  read: (member: ChampSelectTeam) => number
) {
  const championIds: number[] = []

  for (const member of members) {
    const championId = read(member)
    if (championId > 0 && !championIds.includes(championId)) {
      championIds.push(championId)
    }
  }

  return championIds
}

export function readDraftChampSelectSnapshot(
  session: ChampSelectSession | null | undefined
): DraftChampSelectSnapshot {
  if (!session) {
    return EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT
  }

  const myTeam = session.myTeam ?? []
  const theirTeam = session.theirTeam ?? []

  const allyChampionIds = collectChampionIds(myTeam, readAlliedChampionId)
  const enemyChampionIds = collectChampionIds(theirTeam, readOpposingChampionId)

  const self = myTeam.find((member) => member.cellId === session.localPlayerCellId) ?? null

  const selfChampionId = self ? self.championId || self.championPickIntent || 0 : 0

  return {
    allyChampionIds,
    enemyChampionIds,
    selfChampionId: selfChampionId > 0 ? selfChampionId : null,
    selfPosition: self ? toChampionDataPosition(self.assignedPosition) : null,
    actionable: allyChampionIds.length > 0 || enemyChampionIds.length > 0
  }
}
