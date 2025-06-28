import { makeAutoObservable } from 'mobx'

export class LobbyTeamBuilderChampSelect {
  subsetChampionList: number[] = []

  setSubsetChampionList(list: number[]) {
    this.subsetChampionList = list
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class LobbyTeamBuilderState {
  champSelect = new LobbyTeamBuilderChampSelect()

  constructor() {
    makeAutoObservable(this)
  }
}
