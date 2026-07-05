import { GetSearch } from '@shared/types/league-client/matchmaking'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class MatchmakingHttpApi {
  constructor(private _http: AxiosInstance) {}

  accept(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-matchmaking/v1/ready-check/accept', undefined, {
      signal: options.signal
    })
  }

  decline(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-matchmaking/v1/ready-check/decline', undefined, {
      signal: options.signal
    })
  }

  getSearch(options: HttpApiRequestOptions = {}) {
    return this._http.get<GetSearch>('/lol-matchmaking/v1/search', { signal: options.signal })
  }
}
