import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import type { AppColorTheme } from '@shared/types/app-theme'
import { computed } from 'vue'

interface TierColors {
  color: string
  badgeTextColor: string
}

const TIER_PALETTES: Record<AppColorTheme, Record<number | 'unknown', TierColors>> = {
  light: {
    0: { color: '#bd4e12', badgeTextColor: '#ffffff' },
    1: { color: '#2563b8', badgeTextColor: '#ffffff' },
    2: { color: '#087f73', badgeTextColor: '#ffffff' },
    3: { color: '#996408', badgeTextColor: '#ffffff' },
    4: { color: '#64748b', badgeTextColor: '#ffffff' },
    5: { color: '#856448', badgeTextColor: '#ffffff' },
    6: { color: '#75416f', badgeTextColor: '#ffffff' },
    unknown: { color: '#64748b', badgeTextColor: '#ffffff' }
  },
  dark: {
    0: { color: '#eb9147', badgeTextColor: '#374151' },
    1: { color: '#47a6eb', badgeTextColor: '#374151' },
    2: { color: '#42baaa', badgeTextColor: '#374151' },
    3: { color: '#ebbe47', badgeTextColor: '#374151' },
    4: { color: '#b0b6bd', badgeTextColor: '#374151' },
    5: { color: '#b4a18a', badgeTextColor: '#374151' },
    6: { color: '#735271', badgeTextColor: '#ffffff' },
    unknown: { color: '#d4d4d4', badgeTextColor: '#374151' }
  }
}

export function useTierTheme() {
  const appCommon = useAppCommonStore()
  const palette = computed(() => TIER_PALETTES[appCommon.colorTheme])

  const getTierColors = (tier: number | null | undefined): TierColors => {
    const colors = palette.value
    return tier == null ? colors.unknown : (colors[tier] ?? colors.unknown)
  }

  return { getTierColors }
}

interface WinRateColors {
  positive: string
  negative: string
  unknown: string
}

const WIN_RATE_PALETTES: Record<AppColorTheme, WinRateColors> = {
  light: { positive: '#378e55', negative: '#b2474b', unknown: '#64748b' },
  dark: { positive: '#64be86', negative: '#db7e82', unknown: '#c9c9c9' }
}

export function useWinRateTheme() {
  const appCommon = useAppCommonStore()
  const palette = computed(() => WIN_RATE_PALETTES[appCommon.colorTheme])

  // Win rates use the API's 0-1 scale, before percentage formatting.
  const getWinRateColor = (winRate: number | null | undefined) => {
    const colors = palette.value
    if (winRate == null) return colors.unknown
    return winRate >= 0.5 ? colors.positive : colors.negative
  }

  const formatWinRate = (value: number | null | undefined) =>
    value == null ? '-' : `${(value * 100).toFixed(2)}%`

  return { getWinRateColor, formatWinRate }
}
