import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class PreEndOfGameHttpApi {
  constructor(private _http: AxiosInstance) {}

  complete(sequenceEventName: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-pre-end-of-game/v1/complete/${sequenceEventName}`, undefined, {
      signal: options.signal
    })
  }

  getCurrentSequenceEvent(options: HttpApiRequestOptions = {}) {
    return this._http.get('/lol-pre-end-of-game/v1/currentSequenceEvent', {
      signal: options.signal
    })
  }
}
