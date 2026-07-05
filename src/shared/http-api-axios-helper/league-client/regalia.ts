import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class RegaliaHttpApi {
  constructor(private _http: AxiosInstance) {}

  updateRegalia(dto: object, options: HttpApiRequestOptions = {}) {
    return this._http.put('/lol-regalia/v2/current-summoner/regalia', dto, {
      signal: options.signal
    })
  }

  getRegalia(options: HttpApiRequestOptions = {}) {
    return this._http.get('/lol-regalia/v2/current-summoner/regalia', { signal: options.signal })
  }
}
