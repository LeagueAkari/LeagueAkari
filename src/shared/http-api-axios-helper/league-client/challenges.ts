import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class ChallengesHttpApi {
  constructor(private _http: AxiosInstance) {}

  updatePlayerPreferences(config: object, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>('/lol-challenges/v1/update-player-preferences/', config, {
      signal: options.signal
    })
  }

  ackChallengeUpdate(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(`/lol-challenges/v1/ack-challenge-update/${id}`, undefined, {
      signal: options.signal
    })
  }
}
