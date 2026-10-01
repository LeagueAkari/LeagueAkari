import {
  OPGG_CHAMPION_DATA_MODES,
  OPGG_RANKED_POSITIONS,
  OPGG_REGIONS,
  OPGG_TIER_FILTERS
} from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const REGION_FLAGS: Record<string, string> = {
  global: '🌐',
  na: '🇺🇸',
  euw: '🇪🇺',
  eune: '🇪🇺',
  kr: '🇰🇷',
  br: '🇧🇷',
  jp: '🇯🇵',
  lan: '🌎',
  las: '🌎',
  oce: '🇦🇺',
  tr: '🇹🇷',
  ru: '🇷🇺',
  sea: '🌏',
  sg: '🇸🇬',
  id: '🇮🇩',
  ph: '🇵🇭',
  th: '🇹🇭',
  vn: '🇻🇳',
  tw: '🇹🇼',
  me: '🌍'
}

export function useModeOptions() {
  const { t } = useTranslation()

  const modeOptions = computed(() =>
    OPGG_CHAMPION_DATA_MODES.map((mode) => ({
      label: t(`opgg.filters.modes.${mode}`),
      value: mode
    }))
  )

  return { modeOptions }
}

export function usePositionOptions() {
  const { t } = useTranslation()

  const positionOptions = computed(() =>
    OPGG_RANKED_POSITIONS.map((position) => ({
      label: t(`opgg.filters.positions.${position}`),
      value: position
    }))
  )

  return { positionOptions }
}

export function useTierOptions() {
  const { t } = useTranslation()

  const tierOptions = computed(() =>
    OPGG_TIER_FILTERS.map((tier) => ({
      label: t(`opgg.filters.tiers.${tier}`),
      rank: tier === 'ibsg' ? 'gold' : tier.replace('_plus', ''),
      value: tier
    }))
  )

  return { tierOptions }
}

export function useRegionOptions() {
  const { t } = useTranslation()

  const regionOptions = computed(() =>
    OPGG_REGIONS.map((region) => ({
      label: t(`opgg.filters.regions.${region}`),
      flag: REGION_FLAGS[region],
      value: region
    }))
  )

  return { regionOptions }
}
