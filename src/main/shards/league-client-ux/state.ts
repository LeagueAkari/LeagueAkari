import { UxCommandLine } from '@main/utils/ux-cmd'
import { makeAutoObservable, observable } from 'mobx'

export class LeagueClientUxSettings {
  useWmi = false

  constructor() {
    makeAutoObservable(this)
  }

  setUseWmi(s: boolean) {
    this.useWmi = s
  }
}

export class LeagueClientUxState {
  launchedClients: UxCommandLine[] = []

  constructor() {
    makeAutoObservable(this, {
      launchedClients: observable.struct
    })
  }

  setLaunchedClients(c: UxCommandLine[]) {
    this.launchedClients = c
  }
}
