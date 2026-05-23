import { OPGG_RENDERER_NAMESPACE, type OpggRendererContext } from './context'
import { useOpggStore } from './store'

export async function syncOpggSettings(context: OpggRendererContext) {
  const store = useOpggStore()

  await context.settingUtils.savedPropVue(
    OPGG_RENDERER_NAMESPACE,
    store.frontendSettings,
    'autoApplyItems'
  )
  await context.settingUtils.savedPropVue(
    OPGG_RENDERER_NAMESPACE,
    store.frontendSettings,
    'autoApplyRunes'
  )
  await context.settingUtils.savedPropVue(
    OPGG_RENDERER_NAMESPACE,
    store.frontendSettings,
    'autoApplySpells'
  )
}
