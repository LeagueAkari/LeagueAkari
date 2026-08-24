import { CHAMPION_DATA_MAIN_NAMESPACE, type ChampionDataRendererContext } from './context'
import { useChampionDataStore } from './store'

export async function syncChampionDataState(context: ChampionDataRendererContext) {
  const store = useChampionDataStore()
  await context.piniaMobxUtils.sync(CHAMPION_DATA_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(CHAMPION_DATA_MAIN_NAMESPACE, 'state', store)
}
