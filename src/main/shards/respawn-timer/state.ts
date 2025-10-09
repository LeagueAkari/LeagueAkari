import { makeAutoObservable, observable } from 'mobx'

export class RespawnTimerSettings {
  enabled: boolean = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class RespawnTimerState {
  info: {
    timeLeft: number
    totalTime: number
    isDead: boolean
  } = {
    timeLeft: 0,
    totalTime: 0,
    isDead: false
  }

  constructor() {
    makeAutoObservable(this, {
      info: observable.struct
    })
  }
}
