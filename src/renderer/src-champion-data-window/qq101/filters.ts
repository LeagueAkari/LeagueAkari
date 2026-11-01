import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export const tierIcons: Record<number, string> = {
  1: 'iron',
  2: 'bronze',
  3: 'silver',
  4: 'gold',
  5: 'platinum',
  6: 'emerald',
  7: 'diamond',
  8: 'master',
  9: 'grandmaster',
  10: 'challenger',
  88: 'challenger',
  24: 'gold',
  25: 'platinum',
  26: 'emerald',
  27: 'diamond',
  28: 'master'
}

export function useTierOptions() {
  const { t } = useTranslation()

  const tierOptions = computed(() =>
    [255, 88, 10, 9, 28, 8, 27, 7, 26, 6, 25, 5, 24, 4, 3, 2, 1].map((value) => ({
      value,
      label: t(`qq101.tiers.${value}`),
      rank: tierIcons[value]
    }))
  )

  return { tierOptions }
}
