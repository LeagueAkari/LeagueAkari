import { MAIN_WINDOW_UI_RENDERER_NAMESPACE, type MainWindowUiRendererContext } from './context'
import { useMainWindowUiStore } from './store'

export async function syncMainWindowUiSettings(context: MainWindowUiRendererContext) {
  const store = useMainWindowUiStore()

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'useProfileSkinAsBackground'
  )

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'sidebarCollapsed'
  )

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'showTestPage'
  )
}
