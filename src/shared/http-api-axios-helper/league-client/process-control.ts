import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class ProcessControlHttpApi {
  constructor(private _http: AxiosInstance) {}

  quit(options: HttpApiRequestOptions = {}) {
    return this._http.post('/process-control/v1/process/quit', undefined, {
      signal: options.signal
    })
  }
}
