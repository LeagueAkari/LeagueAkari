import { Ballot } from '@shared/types/league-client/honorV2'
import { makeAutoObservable, observableStruct } from 'mobx'

export class HonorState {
  ballot: Ballot | null

  setBallot(b: Ballot | null) {
    this.ballot = b
  }

  constructor() {
    makeAutoObservable(this, {
      ballot: observableStruct
    })
  }
}
