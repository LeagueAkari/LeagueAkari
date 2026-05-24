import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useTranslation } from 'i18next-vue'
import { NButton, useNotification } from 'naive-ui'

import { type SimpleNotificationsRendererContext } from './context'
import { useSimpleNotificationsStore } from './store'

export function watchUpdateDownloadFailed(context: SimpleNotificationsRendererContext) {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'simple-notifications-renderer.updateDownloadFailed'
  })

  const notification = useNotification()

  context.ipc.onEventVue(SelfUpdateRenderer.id, 'error-download-update', (error) => {
    const no = notification.warning({
      title: () => t('title'),
      content: () => (
        <div>
          {t('content', { error: error.message })}
          <div class="flex justify-end gap-2">
            <NButton
              size="tiny"
              onClick={() => {
                no.destroy()
              }}
            >
              {t('negativeText')}
            </NButton>
            <NButton
              type="primary"
              size="tiny"
              onClick={() => {
                showAnnouncementModal()
                no.destroy()
              }}
            >
              {t('positiveText')}
            </NButton>
          </div>
        </div>
      )
    })
  })
}

function showAnnouncementModal() {
  const simpleNotificationsStore = useSimpleNotificationsStore()
  simpleNotificationsStore.showAnnouncementModal = true
}
