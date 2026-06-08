import { makeAutoObservable } from 'mobx'

export class InGameSendSettings {
  cancelShortcut: string | null = null
  sendInterval: number = 65

  setCancelShortcut(shortcut: string | null) {
    this.cancelShortcut = shortcut
  }

  setSendInterval(interval: number) {
    this.sendInterval = interval
  }

  constructor() {
    makeAutoObservable(this, {})
  }
}

export class InGameSendState {
  constructor() {
    makeAutoObservable(this, {})
  }
}
