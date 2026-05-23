import { AUTO_GAMEFLOW_MAIN_NAMESPACE, type AutoGameflowRendererContext } from './context'
import { useAutoGameflowStore } from './store'

export async function syncAutoGameflowState(context: AutoGameflowRendererContext) {
  const store = useAutoGameflowStore()

  await context.piniaMobxUtils.sync(AUTO_GAMEFLOW_MAIN_NAMESPACE, 'state', store)
  await context.piniaMobxUtils.sync(AUTO_GAMEFLOW_MAIN_NAMESPACE, 'settings', store.settings)
}
