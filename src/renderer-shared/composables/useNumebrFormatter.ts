import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { computed } from 'vue'

export const twoFractionDigitsFormatterEnUS = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  notation: 'compact',
  compactDisplay: 'short'
})

export const twoFractionDigitsFormatterZhCN = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  notation: 'compact',
  compactDisplay: 'short'
})

export function useNumberFormatter() {
  const as = useAppCommonStore()

  const formatter = computed(() => {
    return as.settings.locale.toLocaleLowerCase() === 'zh-cn'
      ? twoFractionDigitsFormatterZhCN
      : twoFractionDigitsFormatterEnUS
  })

  const formatExtremeNumber = (value: number, threshold = 10000000) => {
    if (Math.abs(value) < threshold) {
      return value.toLocaleString()
    }

    return formatter.value.format(value)
  }

  return {
    formatExtremeNumber: (value: number, threshold = 10000000) => {
      return formatExtremeNumber(value, threshold)
    }
  }
}
