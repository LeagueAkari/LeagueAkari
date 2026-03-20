import { UxCommandLine } from '@main/utils/native-abilities'
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

  /** 无法查询到 cmd 的情况，给出警告 */
  hasClientButNoCommandLine: boolean = false

  constructor() {
    makeAutoObservable(this, {
      launchedClients: observable.struct
    })
  }

  setLaunchedClients(c: UxCommandLine[]) {
    this.launchedClients = c
  }

  setHasClientButNoCommandLine(has: boolean) {
    this.hasClientButNoCommandLine = has
  }
}
