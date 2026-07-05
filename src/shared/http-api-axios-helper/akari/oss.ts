import { AKARI_OSS_BASE_URL } from '@shared/constants/common'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class AkariOssHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = AKARI_OSS_BASE_URL
    }
  }

  getFile(path: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/${path}`, { signal: options.signal })
  }
}
