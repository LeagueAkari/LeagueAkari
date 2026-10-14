import {
  type DraftAdvisorRiskLevel,
  type DraftAdvisorSnapshot,
  EMPTY_DRAFT_ADVISOR_SNAPSHOT
} from '@shared/types/draft-advisor'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useDraftAdvisorStore = defineStore('shard:draft-advisor-renderer', () => {
  const settings = shallowReactive({
    enabled: false,
    candidateLimit: 12,
    includeBaseWinRate: true,
    riskLevel: 'medium' as DraftAdvisorRiskLevel
  })

  const snapshot = shallowRef<DraftAdvisorSnapshot>(EMPTY_DRAFT_ADVISOR_SNAPSHOT)

  return {
    settings,
    snapshot
  }
})
