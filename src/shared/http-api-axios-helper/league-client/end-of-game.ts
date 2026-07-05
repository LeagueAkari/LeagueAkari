import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class EndOfGameHttpApi {
  constructor(private _http: AxiosInstance) {}

  dismissStats(options: HttpApiRequestOptions = {}) {
    return this._http.post<void>('/lol-end-of-game/v1/state/dismiss-stats', undefined, {
      signal: options.signal
    })
  }
}
