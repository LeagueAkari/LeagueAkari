import { MaybeRefOrGetter, computed, toValue } from 'vue'

/**
 * 玩家图表颜色数组
 * 用于图表中区分不同玩家的数据线
 * 共16种颜色，确保在图表中有良好的区分度
 */
export const playerColors = [
  '#FF6384', // 红色
  '#36A2EB', // 蓝色
  '#FFCE56', // 黄色
  '#4BC0C0', // 青色
  '#9966FF', // 紫色
  '#FF9F40', // 橙色
  '#FF6B9D', // 粉红色
  '#C9CBCF', // 灰色
  '#54C6EB', // 天蓝色
  '#FFB84D', // 浅橙色
  '#C5A3FF', // 淡紫色
  '#4ECDC4', // 青绿色
  '#95E1D3', // 薄荷绿
  '#FF8A80', // 浅红色
  '#81C784', // 绿色
  '#64B5F6' // 浅蓝色
]

export const skillKeyColors: Record<
  string,
  {
    light: string
    dark: string
  }
> = {
  A: {
    light: 'bg-slate-500/40 border-slate-500',
    dark: 'dark:bg-slate-400/20 dark:border-slate-300/60'
  },
  P: {
    light: 'bg-amber-500/40 border-amber-500',
    dark: 'dark:bg-amber-400/20 dark:border-amber-300/60'
  },
  Q: {
    light: 'bg-sky-500/40 border-sky-500',
    dark: 'dark:bg-sky-600/20 dark:border-sky-400/60'
  },
  W: {
    light: 'bg-emerald-500/40 border-emerald-500',
    dark: 'dark:bg-emerald-400/20 dark:border-emerald-400/60'
  },
  E: {
    light: 'bg-violet-500/40 border-violet-500',
    dark: 'dark:bg-violet-400/20 dark:border-violet-400/60'
  },
  R: {
    light: 'bg-orange-500/40 border-orange-500',
    dark: 'dark:bg-orange-400/20 dark:border-orange-400/60'
  },
  '?': {
    light: 'bg-gray-300/40 border-gray-400',
    dark: 'dark:bg-gray-500/20 dark:border-gray-400/60'
  }
}

export function getClassBySkillKey(key: string) {
  const base = 'border border-solid'
  const theme = skillKeyColors[key.toUpperCase()] ?? skillKeyColors['?']
  return `${base} ${theme.light} ${theme.dark}`
}

export function getClassBySkillSlot(slot: number) {
  const map: Record<number, 'Q' | 'W' | 'E' | 'R'> = {
    1: 'Q',
    2: 'W',
    3: 'E',
    4: 'R'
  }

  const key = map[slot] ?? '?'
  return getClassBySkillKey(key)
}

export function useWinResultTagTheme(result: MaybeRefOrGetter<string | undefined>) {
  return computed(() => {
    const r = toValue(result)

    const commonPart = 'text-xs px-1 py-0.5 rounded'

    if (r === 'win') {
      return `dark:bg-white/20 bg-green-700/80 dark:text-white text-white ${commonPart}`
    } else if (r === 'loss') {
      return `dark:bg-white/20 bg-red-700/80 dark:text-white text-white ${commonPart}`
    }

    return `dark:bg-white/20 bg-black/60 dark:text-white text-white ${commonPart}`
  })
}

export function useWinResultTabSwitchTheme(result: MaybeRefOrGetter<string | undefined>) {
  return computed(() => {
    const r = toValue(result)

    if (r === 'win') {
      return {
        selected: 'dark:bg-white/20 bg-green-700/80 dark:text-white text-white',
        unselected: 'dark:text-white/60 text-black/80 hover:dark:bg-white/10 hover:bg-green-700/20'
      }
    } else if (r === 'loss' || r === 'surrender') {
      return {
        selected: 'dark:bg-white/20 bg-red-700/80 dark:text-white text-white',
        unselected: 'dark:text-white/60 text-black/80 hover:dark:bg-white/10 hover:bg-red-700/20'
      }
    }

    return {
      selected: 'dark:bg-white/20 bg-black/60 dark:text-white text-white',
      unselected: 'dark:text-white/60 text-black/80 hover:dark:bg-white/10 hover:bg-black/10'
    }
  })
}

export function getTeamColor(teamIdentifier?: string) {
  if (!teamIdentifier) return '#9CA3AF'

  if (teamIdentifier === 'TEAM-100') return '#3B82F6'
  if (teamIdentifier === 'TEAM-200') return '#EF4444'

  if (teamIdentifier.startsWith('CHERRY-')) {
    const id = Number(teamIdentifier.split('-')[1])
    if (!isNaN(id)) {
      return playerColors[(id - 1) % playerColors.length]
    }
  }

  return '#9CA3AF'
}

export function getDamageTextColor(type: 'physical' | 'magic' | 'true' | (string & {})) {
  if (type === 'physical') return 'text-[#e07856] dark:text-[#f08a6a]'
  if (type === 'magic') return 'text-[#5b9fd7] dark:text-[#6fb0e6]'
  if (type === 'true') return 'text-[#a8a8a8] dark:text-white'

  return 'text-[#e07856] dark:text-[#f08a6a]'
}
