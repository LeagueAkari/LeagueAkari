import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'

import { PLAYER_TABS_RENDERER_NAMESPACE } from './context'
import { usePlayerTabsStore } from './store'

export async function syncPlayerTabsSettings(settingUtils: SettingUtilsRenderer) {
  const store = usePlayerTabsStore()

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'matchHistoryUseSgpApi'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'refreshTabsAfterGameEnds'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'loadCount'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'defaultMatchHistoryTag'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'defaultMatchHistoryTimeRange'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'defaultShowPractice'
  )

  await settingUtils.savedPropVue(
    PLAYER_TABS_RENDERER_NAMESPACE,
    store.frontendSettings,
    'defaultShowIrregularGames'
  )
}
