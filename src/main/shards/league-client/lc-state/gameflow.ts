import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { makeAutoObservable, observableStruct } from 'mobx'

export class GameflowState {
  phase: GameflowPhase | null = null

  session: GameflowSession | null = null

  constructor() {
    makeAutoObservable(this, {
      phase: observableStruct,
      session: observableStruct
    })
  }

  setPhase(phase: GameflowPhase | null) {
    this.phase = phase
  }

  setSession(session: GameflowSession | null) {
    this.session = session
  }
}
