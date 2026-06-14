import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useNativeInputStatus() {
  const appCommonStore = useAppCommonStore()
  const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.nativeInput' })

  const unavailableReason = computed(() => {
    const nativeInput = appCommonStore.nativeSupport.nativeInput

    if (nativeInput.available) {
      return null
    }

    if (!nativeInput.availableOnCurrentPlatform) {
      return t('unsupported')
    }

    if (nativeInput.requiresElevation && !appCommonStore.isElevated) {
      return t('needAdmin')
    }

    return t('unavailable')
  })

  return {
    unavailableReason
  }
}
