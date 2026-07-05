import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class LeagueSessionHttpApi {
  constructor(private _http: AxiosInstance) {}

  getToken(options: HttpApiRequestOptions = {}) {
    return this._http.get<string>('/lol-league-session/v1/league-session-token', {
      signal: options.signal
    })
  }
}
