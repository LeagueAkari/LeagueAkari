import { useTimeLeft } from '@renderer-shared/composables/useTimeLeft'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { NotificationReactive, useNotification } from 'naive-ui'
import { watch } from 'vue'

export function watchAutoReconnectNotification() {
  const autoGameflowStore = useAutoGameflowStore()
  const notification = useNotification()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.autoReconnect'
  })

  const { timeLeft } = useTimeLeft(() => autoGameflowStore.willReconnectAt, null)

  let notificationReactive: NotificationReactive | null = null

  watch(
    () => timeLeft.value,
    (leftMs) => {
      if (leftMs > 0) {
        notificationReactive = notification.success({
          title: () => t('title'),
          content: () => <span>{t('content', { timeLeft: formatSeconds(leftMs / 1000, 1) })}</span>,
          duration: 0
        })
      } else {
        notificationReactive?.destroy()
      }
    },
    { immediate: true }
  )
}
