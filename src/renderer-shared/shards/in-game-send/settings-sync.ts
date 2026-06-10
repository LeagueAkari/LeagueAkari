import { IN_GAME_SEND_MAIN_NAMESPACE, type InGameSendRendererContext } from './context'
import { useInGameSendStore } from './store'

export function syncInGameSendSettings(context: InGameSendRendererContext) {
  const store = useInGameSendStore()

  return context.piniaMobxUtils.sync(IN_GAME_SEND_MAIN_NAMESPACE, 'settings', store.settings)
}

export function syncInGameSendState(context: InGameSendRendererContext) {
  const store = useInGameSendStore()

  return context.piniaMobxUtils.sync(IN_GAME_SEND_MAIN_NAMESPACE, 'state', store.state)
}
