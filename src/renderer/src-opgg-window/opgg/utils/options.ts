import { ModeType } from '@shared/data-sources/opgg/types2'
import { useTranslation } from 'i18next-vue'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

export function useModeOptions() {
  const { t } = useTranslation()

  const modeOptions = computed(() => [
    { label: t('Opgg.modes.ranked'), value: 'ranked' },
    { label: t('Opgg.modes.aram'), value: 'aram' },
    { label: t('Opgg.modes.arena'), value: 'arena' },
    { label: t('Opgg.modes.nexus_blitz'), value: 'nexus_blitz' },
    { label: t('Opgg.modes.urf'), value: 'urf' }
  ])

  return { modeOptions }
}

export function usePositionOptions(mode: MaybeRefOrGetter<ModeType>) {
  const { t } = useTranslation()

  const positionOptions = computed(() => [
    { label: t('Opgg.positions.top'), value: 'top' },
    { label: t('Opgg.positions.jungle'), value: 'jungle' },
    { label: t('Opgg.positions.mid'), value: 'mid' },
    { label: t('Opgg.positions.adc'), value: 'adc' },
    { label: t('Opgg.positions.support'), value: 'support' },
    { label: t('Opgg.positions.none'), value: 'none', disabled: toValue(mode) === 'ranked' }
  ])

  return { positionOptions }
}

export function useTierOptions() {
  const { t } = useTranslation()

  const tierOptions = computed(() => [
    { label: t('Opgg.tiers.all'), value: 'all' },
    { label: t('Opgg.tiers.ibsg'), value: 'ibsg' },
    { label: t('Opgg.tiers.gold_plus'), value: 'gold_plus' },
    { label: t('Opgg.tiers.platinum_plus'), value: 'platinum_plus' },
    { label: t('Opgg.tiers.emerald_plus'), value: 'emerald_plus' },
    { label: t('Opgg.tiers.diamond_plus'), value: 'diamond_plus' },
    { label: t('Opgg.tiers.master'), value: 'master' },
    { label: t('Opgg.tiers.master_plus'), value: 'master_plus' },
    { label: t('Opgg.tiers.grandmaster'), value: 'grandmaster' },
    { label: t('Opgg.tiers.challenger'), value: 'challenger' }
  ])

  return { tierOptions }
}

export function useRegionOptions() {
  const { t } = useTranslation()

  const regionOptions = computed(() => [
    { label: t('Opgg.regions.global'), value: 'global' },
    { label: t('Opgg.regions.na'), value: 'na' },
    { label: t('Opgg.regions.euw'), value: 'euw' },
    { label: t('Opgg.regions.kr'), value: 'kr' },
    { label: t('Opgg.regions.br'), value: 'br' },
    { label: t('Opgg.regions.eune'), value: 'eune' },
    { label: t('Opgg.regions.jp'), value: 'jp' },
    { label: t('Opgg.regions.lan'), value: 'lan' },
    { label: t('Opgg.regions.las'), value: 'las' },
    { label: t('Opgg.regions.oce'), value: 'oce' },
    { label: t('Opgg.regions.tr'), value: 'tr' },
    { label: t('Opgg.regions.ru'), value: 'ru' },
    { label: t('Opgg.regions.sg'), value: 'sg' },
    { label: t('Opgg.regions.vn'), value: 'vn' },
    { label: t('Opgg.regions.tw'), value: 'tw' },
    { label: t('Opgg.regions.me'), value: 'me' }
  ])

  return { regionOptions }
}
