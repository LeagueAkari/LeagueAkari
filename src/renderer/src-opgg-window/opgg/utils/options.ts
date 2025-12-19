import { ModeType } from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

export function useModeOptions() {
  const { t } = useTranslation()

  const modeOptions = computed(() => [
    { label: t('OpggTabAndFilters.modes.ranked'), value: 'ranked' },
    { label: t('OpggTabAndFilters.modes.aram'), value: 'aram' },
    { label: t('OpggTabAndFilters.modes.arena'), value: 'arena' },
    { label: t('OpggTabAndFilters.modes.nexus_blitz'), value: 'nexus_blitz' },
    { label: t('OpggTabAndFilters.modes.urf'), value: 'urf' }
  ])

  return { modeOptions }
}

export function usePositionOptions(mode: MaybeRefOrGetter<ModeType>) {
  const { t } = useTranslation()

  const positionOptions = computed(() => [
    { label: t('OpggTabAndFilters.positions.top'), value: 'top' },
    { label: t('OpggTabAndFilters.positions.jungle'), value: 'jungle' },
    { label: t('OpggTabAndFilters.positions.mid'), value: 'mid' },
    { label: t('OpggTabAndFilters.positions.adc'), value: 'adc' },
    { label: t('OpggTabAndFilters.positions.support'), value: 'support' },
    {
      label: t('OpggTabAndFilters.positions.none'),
      value: 'none',
      disabled: toValue(mode) === 'ranked'
    }
  ])

  return { positionOptions }
}

export function useTierOptions() {
  const { t } = useTranslation()

  const tierOptions = computed(() => [
    { label: t('OpggTabAndFilters.tiers.all'), value: 'all' },
    { label: t('OpggTabAndFilters.tiers.ibsg'), value: 'ibsg' },
    { label: t('OpggTabAndFilters.tiers.gold_plus'), value: 'gold_plus' },
    { label: t('OpggTabAndFilters.tiers.platinum_plus'), value: 'platinum_plus' },
    { label: t('OpggTabAndFilters.tiers.emerald_plus'), value: 'emerald_plus' },
    { label: t('OpggTabAndFilters.tiers.diamond_plus'), value: 'diamond_plus' },
    { label: t('OpggTabAndFilters.tiers.master'), value: 'master' },
    { label: t('OpggTabAndFilters.tiers.master_plus'), value: 'master_plus' },
    { label: t('OpggTabAndFilters.tiers.grandmaster'), value: 'grandmaster' },
    { label: t('OpggTabAndFilters.tiers.challenger'), value: 'challenger' }
  ])

  return { tierOptions }
}

export function useRegionOptions() {
  const { t } = useTranslation()

  const regionOptions = computed(() => [
    { label: t('OpggTabAndFilters.regions.global'), value: 'global' },
    { label: t('OpggTabAndFilters.regions.na'), value: 'na' },
    { label: t('OpggTabAndFilters.regions.euw'), value: 'euw' },
    { label: t('OpggTabAndFilters.regions.kr'), value: 'kr' },
    { label: t('OpggTabAndFilters.regions.br'), value: 'br' },
    { label: t('OpggTabAndFilters.regions.eune'), value: 'eune' },
    { label: t('OpggTabAndFilters.regions.jp'), value: 'jp' },
    { label: t('OpggTabAndFilters.regions.lan'), value: 'lan' },
    { label: t('OpggTabAndFilters.regions.las'), value: 'las' },
    { label: t('OpggTabAndFilters.regions.oce'), value: 'oce' },
    { label: t('OpggTabAndFilters.regions.tr'), value: 'tr' },
    { label: t('OpggTabAndFilters.regions.ru'), value: 'ru' },
    { label: t('OpggTabAndFilters.regions.sg'), value: 'sg' },
    { label: t('OpggTabAndFilters.regions.vn'), value: 'vn' },
    { label: t('OpggTabAndFilters.regions.tw'), value: 'tw' },
    { label: t('OpggTabAndFilters.regions.me'), value: 'me' }
  ])

  return { regionOptions }
}
