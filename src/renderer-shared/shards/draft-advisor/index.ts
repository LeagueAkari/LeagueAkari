import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { DraftAdvisorRiskLevel } from '@shared/types/draft-advisor'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  DRAFT_ADVISOR_MAIN_NAMESPACE,
  DRAFT_ADVISOR_RENDERER_NAMESPACE,
  type DraftAdvisorRendererContext
} from './context'
import { syncDraftAdvisorState } from './state-sync'

@Shard(DraftAdvisorRenderer.id)
export class DraftAdvisorRenderer implements IAkariShardInitDispose {
  static id = DRAFT_ADVISOR_RENDERER_NAMESPACE

  private readonly _context: DraftAdvisorRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {
    this._context = { ipc, piniaMobxUtils }
  }

  setEnabled(enabled: boolean) {
    return this._context.ipc.call(DRAFT_ADVISOR_MAIN_NAMESPACE, 'setEnabled', enabled)
  }

  setRiskLevel(riskLevel: DraftAdvisorRiskLevel) {
    return this._context.ipc.call(DRAFT_ADVISOR_MAIN_NAMESPACE, 'setRiskLevel', riskLevel)
  }

  setIncludeBaseWinRate(includeBaseWinRate: boolean) {
    return this._context.ipc.call(
      DRAFT_ADVISOR_MAIN_NAMESPACE,
      'setIncludeBaseWinRate',
      includeBaseWinRate
    )
  }

  setCandidateLimit(candidateLimit: number) {
    return this._context.ipc.call(DRAFT_ADVISOR_MAIN_NAMESPACE, 'setCandidateLimit', candidateLimit)
  }

  async onInit() {
    await syncDraftAdvisorState(this._context)
  }
}
