import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function usePageSizeOptions() {
  const { t } = useTranslation()

  const pageSizeOptions = computed(() => [
    {
      label: t('playerTabs.profile.itemPerPage', { count: 10 }),
      value: 10
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 20 }),
      value: 20
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 30 }),
      value: 30
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 40 }),
      value: 40
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 50 }),
      value: 50
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 100 }),
      value: 100
    },
    {
      label: t('playerTabs.profile.itemPerPage', { count: 200 }),
      value: 200
    }
  ])

  return pageSizeOptions
}
