import { resolveNativeInputStatus } from '@renderer-shared/shards/app-common/native-input-status'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'

export function createElevatedStartupNotificationSetup() {
  let hasShown = false

  return () => {
    const appCommonStore = useAppCommonStore()
    const notification = useNotification()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'notifications.simple'
    })

    if (!appCommonStore.isElevated || hasShown) {
      return
    }

    hasShown = true

    if (
      resolveNativeInputStatus(
        appCommonStore.nativeSupport.nativeInput,
        appCommonStore.isElevated
      ) === 'initialization-failed'
    ) {
      notification.warning({
        title: () => t('nativeInputInitializationFailed.title'),
        content: () => t('nativeInputInitializationFailed.content'),
        duration: 0
      })
      return
    }

    notification.info({
      title: () => t('elevatedStartup.title'),
      content: () => t('elevatedStartup.content'),
      duration: 2000
    })
  }
}
