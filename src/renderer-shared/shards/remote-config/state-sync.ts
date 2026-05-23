import { REMOTE_CONFIG_MAIN_NAMESPACE, type RemoteConfigRendererContext } from './context'
import { useRemoteConfigStore } from './store'

export async function syncRemoteConfigState(context: RemoteConfigRendererContext) {
  const store = useRemoteConfigStore()

  await context.piniaMobxUtils.sync(REMOTE_CONFIG_MAIN_NAMESPACE, 'state', store)
  await context.piniaMobxUtils.sync(REMOTE_CONFIG_MAIN_NAMESPACE, 'settings', store.settings)
}
