import { ModeType } from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

export function useModeOptions() {
  const { t } = useTranslation()

  const modeOptions = computed(() => [
    { label: t('opgg.filters.modes.ranked'), value: 'ranked' },
    { label: t('opgg.filters.modes.aram'), value: 'aram' },
    { label: t('opgg.filters.modes.arena'), value: 'arena' },
    { label: t('opgg.filters.modes.nexus_blitz'), value: 'nexus_blitz' },
    { label: t('opgg.filters.modes.urf'), value: 'urf' }
  ])

  return { modeOptions }
}

export function usePositionOptions(mode: MaybeRefOrGetter<ModeType>) {
  const { t } = useTranslation()

  const positionOptions = computed(() => [
    { label: t('opgg.filters.positions.top'), value: 'top' },
    { label: t('opgg.filters.positions.jungle'), value: 'jungle' },
    { label: t('opgg.filters.positions.mid'), value: 'mid' },
    { label: t('opgg.filters.positions.adc'), value: 'adc' },
    { label: t('opgg.filters.positions.support'), value: 'support' },
    {
      label: t('opgg.filters.positions.none'),
      value: 'none',
      disabled: toValue(mode) === 'ranked'
    }
  ])

  return { positionOptions }
}

export function useTierOptions() {
  const { t } = useTranslation()

  const tierOptions = computed(() => [
    { label: t('opgg.filters.tiers.all'), value: 'all' },
    { label: t('opgg.filters.tiers.ibsg'), value: 'ibsg' },
    { label: t('opgg.filters.tiers.gold_plus'), value: 'gold_plus' },
    { label: t('opgg.filters.tiers.platinum_plus'), value: 'platinum_plus' },
    { label: t('opgg.filters.tiers.emerald_plus'), value: 'emerald_plus' },
    { label: t('opgg.filters.tiers.diamond_plus'), value: 'diamond_plus' },
    { label: t('opgg.filters.tiers.master'), value: 'master' },
    { label: t('opgg.filters.tiers.master_plus'), value: 'master_plus' },
    { label: t('opgg.filters.tiers.grandmaster'), value: 'grandmaster' },
    { label: t('opgg.filters.tiers.challenger'), value: 'challenger' }
  ])

  return { tierOptions }
}

export function useRegionOptions() {
  const { t } = useTranslation()

  const regionOptions = computed(() => [
    { label: t('opgg.filters.regions.global'), value: 'global' },
    { label: t('opgg.filters.regions.na'), value: 'na' },
    { label: t('opgg.filters.regions.euw'), value: 'euw' },
    { label: t('opgg.filters.regions.kr'), value: 'kr' },
    { label: t('opgg.filters.regions.br'), value: 'br' },
    { label: t('opgg.filters.regions.eune'), value: 'eune' },
    { label: t('opgg.filters.regions.jp'), value: 'jp' },
    { label: t('opgg.filters.regions.lan'), value: 'lan' },
    { label: t('opgg.filters.regions.las'), value: 'las' },
    { label: t('opgg.filters.regions.oce'), value: 'oce' },
    { label: t('opgg.filters.regions.tr'), value: 'tr' },
    { label: t('opgg.filters.regions.ru'), value: 'ru' },
    { label: t('opgg.filters.regions.sg'), value: 'sg' },
    { label: t('opgg.filters.regions.vn'), value: 'vn' },
    { label: t('opgg.filters.regions.tw'), value: 'tw' },
    { label: t('opgg.filters.regions.me'), value: 'me' }
  ])

  return { regionOptions }
}
