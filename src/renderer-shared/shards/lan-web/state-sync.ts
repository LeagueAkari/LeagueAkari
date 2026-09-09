import { LAN_WEB_MAIN_NAMESPACE } from '@shared/shards/lan-web'

import type { LanWebRendererContext } from './context'
import { useLanWebStore } from './store'

export async function syncLanWebState(context: LanWebRendererContext) {
  const store = useLanWebStore()
  await context.piniaMobxUtils.sync(LAN_WEB_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(LAN_WEB_MAIN_NAMESPACE, 'state', store.state)
}
