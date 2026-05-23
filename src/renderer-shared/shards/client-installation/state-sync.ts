import {
  CLIENT_INSTALLATION_MAIN_NAMESPACE,
  type ClientInstallationRendererContext
} from './context'
import { useClientInstallationStore } from './store'

export async function syncClientInstallationState(context: ClientInstallationRendererContext) {
  const store = useClientInstallationStore()

  await context.piniaMobxUtils.sync(CLIENT_INSTALLATION_MAIN_NAMESPACE, 'state', store)
}
