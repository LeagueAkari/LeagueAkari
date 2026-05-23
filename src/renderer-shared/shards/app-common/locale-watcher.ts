import i18next from 'i18next'
import { watch } from 'vue'

import { useAppCommonStore } from './store'

export function watchAppLocale() {
  const store = useAppCommonStore()

  watch(
    () => store.settings.locale,
    (lo) => {
      i18next.changeLanguage(lo)
    },
    { immediate: true }
  )
}
