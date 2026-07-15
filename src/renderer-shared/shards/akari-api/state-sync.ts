import { AKARI_API_MAIN_NAMESPACE, type AkariApiRendererContext } from './context'
import { useAkariApiStore } from './store'

export async function syncAkariApiState(context: AkariApiRendererContext) {
  await context.piniaMobxUtils.sync(AKARI_API_MAIN_NAMESPACE, 'state', useAkariApiStore())
}
