import { AUTO_CHAMP_CONFIG_MAIN_NAMESPACE, type AutoChampConfigRendererContext } from './context'
import { useAutoChampConfigStore } from './store'

export async function syncAutoChampConfigSettings(context: AutoChampConfigRendererContext) {
  const store = useAutoChampConfigStore()

  await context.piniaMobxUtils.sync(AUTO_CHAMP_CONFIG_MAIN_NAMESPACE, 'settings', store.settings)
}
