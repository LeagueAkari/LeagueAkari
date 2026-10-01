import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_OPGG_NAMESPACE,
  CHAMPION_DATA_QQ101_NAMESPACE,
  type ChampionDataRendererContext
} from './context'
import { useChampionDataStore } from './store'

export async function syncChampionDataState(context: ChampionDataRendererContext) {
  const store = useChampionDataStore()
  await Promise.all([
    context.piniaMobxUtils.sync(CHAMPION_DATA_MAIN_NAMESPACE, 'settings', store.settings),
    context.piniaMobxUtils.sync(CHAMPION_DATA_OPGG_NAMESPACE, 'state', store.opgg),
    context.piniaMobxUtils.sync(CHAMPION_DATA_QQ101_NAMESPACE, 'state', store.qq101)
  ])
}

export async function syncChampionDataResources(context: ChampionDataRendererContext) {
  const store = useChampionDataStore()

  await context.piniaMobxUtils.sync(CHAMPION_DATA_OPGG_NAMESPACE, 'resources', store.opgg)
}
