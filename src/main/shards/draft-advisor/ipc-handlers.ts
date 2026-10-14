import type { DraftAdvisorRiskLevel } from '@shared/types/draft-advisor'

import type { AkariIpcMain } from '../ipc'
import {
  DRAFT_ADVISOR_MAX_CANDIDATE_LIMIT,
  DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT,
  type DraftAdvisorMainContext
} from './context'

export function clampCandidateLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT
  }

  return Math.min(
    Math.max(Math.round(limit), DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT),
    DRAFT_ADVISOR_MAX_CANDIDATE_LIMIT
  )
}

export class DraftAdvisorIpcHandlers {
  constructor(
    private readonly _context: DraftAdvisorMainContext,
    private readonly _ipc: AkariIpcMain
  ) {}

  register() {
    const { namespace, settingService, state } = this._context

    this._ipc.onCall(namespace, 'getSnapshot', () => state.snapshot)

    this._ipc.onCall(namespace, 'setEnabled', async (_, enabled: boolean) => {
      await settingService.set('enabled', enabled)
    })

    this._ipc.onCall(namespace, 'setRiskLevel', async (_, riskLevel: DraftAdvisorRiskLevel) => {
      await settingService.set('riskLevel', riskLevel)
    })

    this._ipc.onCall(namespace, 'setIncludeBaseWinRate', async (_, value: boolean) => {
      await settingService.set('includeBaseWinRate', value)
    })

    this._ipc.onCall(namespace, 'setCandidateLimit', async (_, limit: number) => {
      await settingService.set('candidateLimit', clampCandidateLimit(limit))
    })
  }

  dispose() {}
}
