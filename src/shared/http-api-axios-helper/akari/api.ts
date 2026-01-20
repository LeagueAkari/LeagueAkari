import { AKARI_API_BASE_URL } from '@shared/constants/common'
import { ReleaseOverridesPlainObject } from '@shared/validators/remote-config'
import { AxiosInstance } from 'axios'

export class AkariApiHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = AKARI_API_BASE_URL
    }
  }

  postStatisticsRecord(version: string) {
    return this._http.post('/statistics/v1/records', { version })
  }

  getLastResortLatestRelease() {
    return this._http.get<ReleaseOverridesPlainObject>('/last-resort/v1/latest-release')
  }
}
