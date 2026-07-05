import { LoginQueueState } from '@shared/types/league-client/login'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class LoginHttpApi {
  constructor(private _http: AxiosInstance) {}

  dodge(options: HttpApiRequestOptions = {}) {
    return this._http.post(
      '/lol-login/v1/session/invoke',
      {
        data: ['', 'teambuilder-draft', 'quitV2', '']
      },
      {
        signal: options.signal,
        params: {
          destination: 'lcdsServiceProxy',
          method: 'call',
          args: '["", "teambuilder-draft", "quitV2", ""]'
        }
      }
    )
  }

  getLoginQueueState(options: HttpApiRequestOptions = {}) {
    return this._http.get<LoginQueueState>('/lol-login/v1/login-queue-state', {
      signal: options.signal
    })
  }
}
