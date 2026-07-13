import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'

export function createElevatedStartupNotificationSetup() {
  let hasShown = false

  return () => {
    const appCommonStore = useAppCommonStore()
    const notification = useNotification()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'notifications.simple.elevatedStartup'
    })

    if (!appCommonStore.isElevated || hasShown) {
      return
    }

    hasShown = true
    notification.info({
      title: () => t('title'),
      content: () => t('content'),
      duration: 2000
    })
  }
}
