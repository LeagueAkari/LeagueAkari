import { RESPAWN_TIMER_MAIN_NAMESPACE, type RespawnTimerRendererContext } from './context'
import { useRespawnTimerStore } from './store'

export async function syncRespawnTimerState(context: RespawnTimerRendererContext) {
  const store = useRespawnTimerStore()

  await context.piniaMobxUtils.sync(RESPAWN_TIMER_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(RESPAWN_TIMER_MAIN_NAMESPACE, 'state', store)
}
