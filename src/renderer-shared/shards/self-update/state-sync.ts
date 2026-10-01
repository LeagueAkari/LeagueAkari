import { SELF_UPDATE_MAIN_NAMESPACE, type SelfUpdateRendererContext } from './context'
import { useSelfUpdateStore } from './store'

export async function syncSelfUpdateState(context: SelfUpdateRendererContext) {
  const store = useSelfUpdateStore()
  await context.piniaMobxUtils.sync(SELF_UPDATE_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(SELF_UPDATE_MAIN_NAMESPACE, 'state', store)
}
