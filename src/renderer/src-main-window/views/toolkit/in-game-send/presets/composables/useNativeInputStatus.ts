import { resolveNativeInputStatus } from '@renderer-shared/shards/app-common/native-input-status'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useNativeInputStatus() {
  const appCommonStore = useAppCommonStore()
  const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.nativeInput' })

  const unavailableReason = computed(() => {
    const status = resolveNativeInputStatus(
      appCommonStore.nativeSupport.nativeInput,
      appCommonStore.isElevated
    )

    switch (status) {
      case 'available':
        return null
      case 'unsupported-platform':
        return t('unsupported')
      case 'requires-elevation':
        return t('needAdmin')
      case 'initialization-failed':
        return t('initializationFailed')
    }
  })

  return {
    unavailableReason
  }
}
