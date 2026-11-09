import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'

import { AppCommonRenderer } from '.'
import { useInstance } from '..'
import { useAppCommonStore } from './store'

export function useAdministratorRelaunch() {
  const appCommon = useInstance(AppCommonRenderer)
  const store = useAppCommonStore()
  const message = useMessage()
  const { t } = useTranslation()

  return async () => {
    if (!store.isWindows) {
      return false
    }
    try {
      await appCommon.relaunchAsAdministrator()
    } catch {
      message.warning(t('notifications.simple.administratorRelaunchFailed'))
    }
    // Keep the dialog available for retry if elevation was cancelled or failed.
    return false
  }
}
