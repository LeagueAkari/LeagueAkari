import { AKARI_API_BASE_URL } from '@shared/constants/common'
import { ReleaseOverridesPlainObject } from '@shared/schemas/remote-config'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class AkariApiHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = AKARI_API_BASE_URL
    }
  }

  postStatisticsRecord(version: string, options: HttpApiRequestOptions = {}) {
    return this._http.post('/statistics/v1/records', { version }, { signal: options.signal })
  }

  getLastResortLatestRelease(options: HttpApiRequestOptions = {}) {
    return this._http.get<ReleaseOverridesPlainObject>('/last-resort/v1/latest-release', {
      signal: options.signal
    })
  }
}
