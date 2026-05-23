import { GAME_CLIENT_MAIN_NAMESPACE, type GameClientRendererContext } from './context'
import { useGameClientStore } from './store'

export async function syncGameClientSettings(context: GameClientRendererContext) {
  const store = useGameClientStore()

  await context.piniaMobxUtils.sync(GAME_CLIENT_MAIN_NAMESPACE, 'settings', store.settings)
}
