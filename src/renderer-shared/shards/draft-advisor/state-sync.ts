import { DRAFT_ADVISOR_MAIN_NAMESPACE, type DraftAdvisorRendererContext } from './context'
import { useDraftAdvisorStore } from './store'

export async function syncDraftAdvisorState(context: DraftAdvisorRendererContext) {
  const store = useDraftAdvisorStore()

  await context.piniaMobxUtils.sync(DRAFT_ADVISOR_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(DRAFT_ADVISOR_MAIN_NAMESPACE, 'state', store)
}
