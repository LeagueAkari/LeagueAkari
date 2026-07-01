import { makeAutoObservable } from 'mobx'

export class AutoLoginCSettings {
  gamePath = ''
  toolPath = ''

  constructor() {
    makeAutoObservable(this)
  }

  setGamePath(p: string) { this.gamePath = p }
  setToolPath(p: string) { this.toolPath = p }
}
