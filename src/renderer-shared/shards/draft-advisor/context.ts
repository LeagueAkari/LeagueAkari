import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const DRAFT_ADVISOR_MAIN_NAMESPACE = 'draft-advisor-main'
export const DRAFT_ADVISOR_RENDERER_NAMESPACE = 'draft-advisor-renderer'

export interface DraftAdvisorRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
