import { MAIN_WINDOW_UI_RENDERER_NAMESPACE, type MainWindowUiRendererContext } from './context'
import { type MainWindowBackgroundImageMode, useMainWindowUiStore } from './store'

const BACKGROUND_IMAGE_MODES = new Set<MainWindowBackgroundImageMode>([
  'profile-skin',
  'custom-image',
  'none'
])

export async function syncMainWindowUiSettings(context: MainWindowUiRendererContext) {
  const store = useMainWindowUiStore()

  const savedBackgroundImageMode = await context.settingUtils.get(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    'backgroundImageMode'
  )

  if (
    typeof savedBackgroundImageMode === 'string' &&
    BACKGROUND_IMAGE_MODES.has(savedBackgroundImageMode as MainWindowBackgroundImageMode)
  ) {
    store.frontendSettings.backgroundImageMode =
      savedBackgroundImageMode as MainWindowBackgroundImageMode
  } else {
    const useProfileSkinAsBackground = await context.settingUtils.get(
      MAIN_WINDOW_UI_RENDERER_NAMESPACE,
      'useProfileSkinAsBackground',
      false
    )
    store.frontendSettings.backgroundImageMode = useProfileSkinAsBackground
      ? 'profile-skin'
      : 'none'
    await context.settingUtils.set(
      MAIN_WINDOW_UI_RENDERER_NAMESPACE,
      'backgroundImageMode',
      store.frontendSettings.backgroundImageMode
    )
  }

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'backgroundImageMode'
  )

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'customBackgroundFilePath'
  )

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'customBackgroundRevision'
  )

  await context.settingUtils.savedPropVue(
    MAIN_WINDOW_UI_RENDERER_NAMESPACE,
    store.frontendSettings,
    'customBackgroundOverlayStrength'
  )

  store.frontendSettings.customBackgroundFilePath =
    typeof store.frontendSettings.customBackgroundFilePath === 'string'
      ? store.frontendSettings.customBackgroundFilePath
      : ''
  store.frontendSettings.customBackgroundRevision = Number.isFinite(
    store.frontendSettings.customBackgroundRevision
  )
    ? store.frontendSettings.customBackgroundRevision
    : 0
  const customBackgroundOverlayStrength = Number(
    store.frontendSettings.customBackgroundOverlayStrength
  )
  store.frontendSettings.customBackgroundOverlayStrength = Number.isFinite(
    customBackgroundOverlayStrength
  )
    ? Math.min(1, Math.max(0, customBackgroundOverlayStrength))
    : 0.8

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
