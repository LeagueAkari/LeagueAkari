import {
  type AkariApiConfigResource,
  type AkariApiConfigResourceMap,
  type AkariApiLanguage,
  type AkariLastResortRelease,
  type AkariNotice,
  type AkariRelease,
  type AkariStatisticsRecordCreated,
  DEFAULT_AKARI_API_BASE_URL,
  DEFAULT_AKARI_API_LANGUAGE
} from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class AkariApiHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = DEFAULT_AKARI_API_BASE_URL
    }
  }

  getLatestNotice(
    language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<AkariNotice>('/notice/v1/latest', {
      params: { lang: language },
      signal: options.signal
    })
  }

  getConfig<Resource extends AkariApiConfigResource>(
    resource: Resource,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<AkariApiConfigResourceMap[Resource]>(`/config/v1/${resource}`, {
      signal: options.signal
    })
  }

  getLatestRelease(
    language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<AkariRelease>('/releases/v1/latest', {
      params: { lang: language },
      signal: options.signal
    })
  }

  postStatisticsRecord(version: string, options: HttpApiRequestOptions = {}) {
    return this._http.post<AkariStatisticsRecordCreated>(
      '/statistics/v1/records',
      { version },
      { signal: options.signal }
    )
  }

  getLastResortLatestRelease(options: HttpApiRequestOptions = {}) {
    return this._http.get<AkariLastResortRelease>('/last-resort/v1/latest-release', {
      signal: options.signal
    })
  }
}
