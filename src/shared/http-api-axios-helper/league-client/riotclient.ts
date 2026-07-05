import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class RiotClientHttpApi {
  constructor(private _http: AxiosInstance) {}

  killUx(options: HttpApiRequestOptions = {}) {
    return this._http.post('/riotclient/kill-ux', undefined, { signal: options.signal })
  }

  launchUx(options: HttpApiRequestOptions = {}) {
    return this._http.post('/riotclient/launch-ux', undefined, { signal: options.signal })
  }

  restartUx(options: HttpApiRequestOptions = {}) {
    return this._http.post('riotclient/kill-and-restart-ux', undefined, { signal: options.signal })
  }

  splash(options: HttpApiRequestOptions = {}) {
    return this._http.put('/riotclient/splash', undefined, { signal: options.signal })
  }
}
