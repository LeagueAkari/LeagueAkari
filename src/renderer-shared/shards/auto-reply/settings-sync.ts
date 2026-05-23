import { AUTO_REPLY_MAIN_NAMESPACE, type AutoReplyRendererContext } from './context'
import { useAutoReplyStore } from './store'

export async function syncAutoReplySettings(context: AutoReplyRendererContext) {
  const store = useAutoReplyStore()

  await context.piniaMobxUtils.sync(AUTO_REPLY_MAIN_NAMESPACE, 'settings', store.settings)
}
