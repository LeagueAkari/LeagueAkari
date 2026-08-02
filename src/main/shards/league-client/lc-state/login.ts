import { LoginQueueState } from '@shared/types/league-client/login'
import { makeAutoObservable, observableStruct } from 'mobx'

export class LoginState {
  loginQueueState: LoginQueueState | null = null

  constructor() {
    makeAutoObservable(this, { loginQueueState: observableStruct })
  }

  setLoginQueueState(state: LoginQueueState | null) {
    this.loginQueueState = state
  }
}
