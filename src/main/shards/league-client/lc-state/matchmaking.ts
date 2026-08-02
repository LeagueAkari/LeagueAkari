import { GetSearch, ReadyCheck } from '@shared/types/league-client/matchmaking'
import { makeAutoObservable, observableStruct } from 'mobx'

export class MatchmakingState {
  readyCheck: ReadyCheck | null = null
  search: GetSearch | null = null

  constructor() {
    makeAutoObservable(this, { readyCheck: observableStruct, search: observableStruct })
  }

  setReadyCheck(readyCheck: ReadyCheck | null) {
    this.readyCheck = readyCheck
  }

  setSearch(search: GetSearch | null) {
    this.search = search
  }
}
