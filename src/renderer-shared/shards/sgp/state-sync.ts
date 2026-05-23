import { SGP_MAIN_NAMESPACE, type SgpRendererContext } from './context'
import { useSgpStore } from './store'

export async function syncSgpState(context: SgpRendererContext) {
  const store = useSgpStore()

  await context.piniaMobxUtils.sync(SGP_MAIN_NAMESPACE, 'state', store)
}
