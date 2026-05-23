import { AUTO_SELECT_MAIN_NAMESPACE, type AutoSelectRendererContext } from './context'
import { useAutoSelectStore } from './store'

export async function syncAutoSelectState(context: AutoSelectRendererContext) {
  const store = useAutoSelectStore()

  await context.piniaMobxUtils.sync(AUTO_SELECT_MAIN_NAMESPACE, 'state', store)
  await context.piniaMobxUtils.sync(AUTO_SELECT_MAIN_NAMESPACE, 'settings', store.settings)
}
