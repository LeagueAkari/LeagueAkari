import { type AdditionalInfoRendererContext, ONGOING_GAME_MAIN_NAMESPACE } from './context'
import { useAdditionalInfoStore } from './store'

export function syncAdditionalInfoState(context: AdditionalInfoRendererContext) {
  const store = useAdditionalInfoStore()

  return context.piniaMobxUtils.sync(ONGOING_GAME_MAIN_NAMESPACE, 'additional', store)
}
