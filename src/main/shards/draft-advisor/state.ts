import {
  type DraftAdvisorRiskLevel,
  type DraftAdvisorSnapshot,
  EMPTY_DRAFT_ADVISOR_SNAPSHOT
} from '@shared/types/draft-advisor'
import { makeAutoObservable, observableRef } from 'mobx'

export class DraftAdvisorSettings {
  enabled: boolean = false

  candidateLimit: number = 12

  includeBaseWinRate: boolean = true

  riskLevel: DraftAdvisorRiskLevel = 'medium'

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setCandidateLimit(candidateLimit: number) {
    this.candidateLimit = candidateLimit
  }

  setIncludeBaseWinRate(includeBaseWinRate: boolean) {
    this.includeBaseWinRate = includeBaseWinRate
  }

  setRiskLevel(riskLevel: DraftAdvisorRiskLevel) {
    this.riskLevel = riskLevel
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class DraftAdvisorState {
  snapshot: DraftAdvisorSnapshot = EMPTY_DRAFT_ADVISOR_SNAPSHOT

  setSnapshot(snapshot: DraftAdvisorSnapshot) {
    this.snapshot = snapshot
  }

  reset() {
    this.snapshot = EMPTY_DRAFT_ADVISOR_SNAPSHOT
  }

  constructor() {
    makeAutoObservable(this, {
      snapshot: observableRef
    })
  }
}
