import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'
import { APP_COMMON_MAIN_NAMESPACE, APP_COMMON_RENDERER_NAMESPACE } from './context'
import { useAppCommonStore } from './store'

export async function syncAppCommonRendererState(
  piniaMobxUtils: PiniaMobxUtilsRenderer,
  settingUtils: SettingUtilsRenderer,
  getVersion: () => Promise<string>
) {
  const store = useAppCommonStore()
  store.version = await getVersion()

  await settingUtils.savedGetterVue(
    APP_COMMON_RENDERER_NAMESPACE,
    'tempAkariSubscriptionInfo',
    () => store.tempAkariSubscriptionInfo,
    (v) => (store.tempAkariSubscriptionInfo = v)
  )

  await piniaMobxUtils.sync(APP_COMMON_MAIN_NAMESPACE, 'state', store)
  await piniaMobxUtils.sync(APP_COMMON_MAIN_NAMESPACE, 'settings', store.settings)
}
