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

export function useWinResultTagTheme(result: MaybeRefOrGetter<string | undefined>) {
  return computed(() => {
    const r = toValue(result)

    const commonPart = 'text-xs px-1 py-0.5 rounded'

    if (r === 'win') {
      return `dark:bg-white/20 bg-green-700/80 dark:text-white text-white ${commonPart}`
    } else if (r === 'lose') {
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
    } else if (r === 'lose' || r === 'surrender') {
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
