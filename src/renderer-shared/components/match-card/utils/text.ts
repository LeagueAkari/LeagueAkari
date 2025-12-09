import { formatI18nOrdinal } from '@shared/i18n'

// will be replaced by i18n
const GAME_RESULT_MAP = {
  abort: '被终止',
  remake: '重开',
  win: '胜利',
  loss: '失败'
}

export function useGameResultName() {
  return (subteamPlacement: number | null, result: string, isSurrender = false, locale: string) => {
    if (subteamPlacement !== null && subteamPlacement !== 0) {
      return formatI18nOrdinal(subteamPlacement, locale)
    }

    if (isSurrender && result !== 'remake') {
      return '投降'
    }

    return GAME_RESULT_MAP[result as keyof typeof GAME_RESULT_MAP] || result
  }
}

const TEAM_NAME_MAP = {
  'TEAM-100': '蓝队',
  'TEAM-200': '红队',
  'CHERRY-0': '?',
  'CHERRY-1': '魄罗',
  'CHERRY-2': '小兵',
  'CHERRY-3': '迅捷蟹',
  'CHERRY-4': '石甲虫',
  'CHERRY-5': '锋喙鸟',
  'CHERRY-6': '哨卫',
  'CHERRY-7': '狼',
  'CHERRY-8': '魔沼蛙'
}

export function useTeamName() {
  return (teamIdentifier: string) => {
    return TEAM_NAME_MAP[teamIdentifier as keyof typeof TEAM_NAME_MAP] || teamIdentifier
  }
}

const FRAME_EVENT_TYPE_MAP = {
  CHAMPION_KILL: '英雄击杀',
  CHAMPION_SPECIAL_KILL: '特殊击杀',
  BUILDING_KILL: '摧毁建筑',
  TURRET_PLATE_DESTROYED: '防御塔镀层摧毁'
}

export function useFrameEventType() {
  return (type: string) => {
    return FRAME_EVENT_TYPE_MAP[type as keyof typeof FRAME_EVENT_TYPE_MAP] || type
  }
}

const BUILDING_TYPE_MAP = {
  TOWER_BUILDING: '防御塔',
  INHIBITOR_BUILDING: '抑制水晶'
}

export const TOWER_TYPE_MAP = {
  OUTER_TURRET: '外防御塔',
  INNER_TURRET: '内防御塔',
  BASE_TURRET: '高地防御塔',
  NEXUS_TURRET: '枢纽防御塔'
}

export const LANE_TYPE_MAP = {
  MID_LANE: '中路',
  TOP_LANE: '上路',
  BOT_LANE: '下路'
}

export function useBuildingType() {
  return (type: string) => {
    return BUILDING_TYPE_MAP[type as keyof typeof BUILDING_TYPE_MAP] || type
  }
}

export function useTowerType() {
  return (type: string) => {
    return TOWER_TYPE_MAP[type as keyof typeof TOWER_TYPE_MAP] || type
  }
}

export function useLaneType() {
  return (type: string) => {
    return LANE_TYPE_MAP[type as keyof typeof LANE_TYPE_MAP] || type
  }
}

const POSITION_MAP = {
  TOP: '上路',
  JUNGLE: '打野',
  MIDDLE: '中路',
  BOTTOM: '下路',
  UTILITY: '辅助'
}

export function usePosition() {
  return (position: string) => {
    return POSITION_MAP[position as keyof typeof POSITION_MAP] || position
  }
}
