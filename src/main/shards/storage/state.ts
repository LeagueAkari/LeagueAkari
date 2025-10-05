import { makeAutoObservable } from 'mobx'

export class StorageState {
  usingHigherVersionDb = false

  constructor() {
    makeAutoObservable(this)
  }

  setUsingHigherVersionDb(value: boolean) {
    this.usingHigherVersionDb = value
  }
}
