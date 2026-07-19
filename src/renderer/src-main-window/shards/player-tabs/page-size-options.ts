import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export const MATCH_HISTORY_REGULAR_PAGE_SIZES = [10, 20, 30, 40, 50, 100, 200] as const
export const MATCH_HISTORY_COLLECTION_PAGE_SIZES = [300, 500, 750, 1000] as const

export const MATCH_HISTORY_MAX_REGULAR_PAGE_SIZE = MATCH_HISTORY_REGULAR_PAGE_SIZES.at(-1)!
export const MATCH_HISTORY_COLLECTION_MAX_SCAN_COUNT = MATCH_HISTORY_COLLECTION_PAGE_SIZES.at(-1)!

export function usePageSizeOptions() {
  const { t } = useTranslation()

  const pageSizeOptions = computed(() =>
    MATCH_HISTORY_REGULAR_PAGE_SIZES.map((count) => ({
      label: t('playerTabs.profile.itemPerPage', { count }),
      value: count
    }))
  )

  return pageSizeOptions
}

export function useMatchHistoryPageSizeOptions() {
  const { t } = useTranslation()
  const regularPageSizeOptions = usePageSizeOptions()

  return computed(() => [
    ...regularPageSizeOptions.value,
    ...MATCH_HISTORY_COLLECTION_PAGE_SIZES.map((count) => ({
      label: t('playerTabs.profile.itemPerPage', { count }),
      value: count
    }))
  ])
}
