import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class GameflowHttpApi {
  constructor(private _http: AxiosInstance) {}

  getPhase(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameflowPhase>('/lol-gameflow/v1/gameflow-phase', {
      signal: options.signal
    })
  }

  getSession(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameflowSession>('/lol-gameflow/v1/session', { signal: options.signal })
  }

  earlyExit(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-gameflow/v1/early-exit', undefined, { signal: options.signal })
  }

  dodge(options: HttpApiRequestOptions = {}) {
    return this._http.post(
      '/lol-gameflow/v1/session/dodge',
      {
        dodgeIds: [1145141919810],
        phase: 'ChampSelect'
      },
      { signal: options.signal }
    )
  }

  reconnect(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-gameflow/v1/reconnect', undefined, { signal: options.signal })
  }

  ackFailedToLaunch(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-gameflow/v1/ack-failed-to-launch', undefined, {
      signal: options.signal
    })
  }
}
