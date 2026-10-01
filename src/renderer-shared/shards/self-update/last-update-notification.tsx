import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import { watchEffect } from 'vue'

import { useAppCommonStore } from '../app-common/store'
import { useSelfUpdateStore } from './store'

export function watchLastUpdateSucceeded() {
  const appCommonStore = useAppCommonStore()
  const selfUpdateStore = useSelfUpdateStore()
  const { t } = useTranslation()
  const notification = useNotification()

  watchEffect(() => {
    if (selfUpdateStore.lastUpdateSucceeded !== null) {
      if (selfUpdateStore.lastUpdateSucceeded) {
        notification.success({
          title: () => t('selfUpdate.tasks.title'),
          content: () =>
            t('selfUpdate.tasks.lastUpdateSuccess', {
              version: appCommonStore.version
            }),
          duration: 4000,
          closable: true
        })
      } else {
        notification.warning({
          title: () => t('selfUpdate.tasks.title'),
          content: () => <div>{t('selfUpdate.tasks.lastUpdateFailed')}</div>,
          duration: 1e10,
          closable: true
        })
      }
    }
  })
}
