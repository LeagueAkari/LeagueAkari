import { AKARI_API_BASE_URL } from '@shared/constants/common'
import {
  type AkariApiConfigResource,
  type AkariApiConfigResourceMap,
  type AkariApiLanguage,
  type AkariLastResortRelease,
  type AkariNotice,
  type AkariRelease,
  DEFAULT_AKARI_API_LANGUAGE,
  isAkariApiConfigResource,
  isAkariApiLanguage
} from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

const CANONICAL_SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

export class AkariApiHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = AKARI_API_BASE_URL
    }
  }

  getLatestNotice(
    language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE,
    options: HttpApiRequestOptions = {}
  ) {
    this._assertLanguage(language)
    return this._http.get<AkariNotice>('/notice/v1/latest', {
      params: { lang: language },
      signal: options.signal
    })
  }

  getConfig<Resource extends AkariApiConfigResource>(
    resource: Resource,
    options: HttpApiRequestOptions = {}
  ) {
    if (!isAkariApiConfigResource(resource)) {
      throw new TypeError(`Unsupported Akari API config resource: ${String(resource)}`)
    }

    return this._http.get<AkariApiConfigResourceMap[Resource]>(`/config/v1/${resource}`, {
      signal: options.signal
    })
  }

  getLatestRelease(
    language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE,
    options: HttpApiRequestOptions = {}
  ) {
    return this._getRelease('latest', language, options)
  }

  getRelease(
    version: string,
    language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE,
    options: HttpApiRequestOptions = {}
  ) {
    if (!CANONICAL_SEMVER_PATTERN.test(version)) {
      throw new TypeError('Akari release version must be a canonical semantic version without v')
    }

    return this._getRelease(version, language, options)
  }

  postStatisticsRecord(version: string, options: HttpApiRequestOptions = {}) {
    return this._http.post('/statistics/v1/records', { version }, { signal: options.signal })
  }

  getLastResortLatestRelease(options: HttpApiRequestOptions = {}) {
    return this._http.get<AkariLastResortRelease>('/last-resort/v1/latest-release', {
      signal: options.signal
    })
  }

  private _getRelease(version: string, language: AkariApiLanguage, options: HttpApiRequestOptions) {
    this._assertLanguage(language)
    return this._http.get<AkariRelease>(`/releases/v1/${encodeURIComponent(version)}`, {
      params: { lang: language },
      signal: options.signal
    })
  }

  private _assertLanguage(language: AkariApiLanguage) {
    if (!isAkariApiLanguage(language)) {
      throw new TypeError(`Unsupported Akari API language: ${String(language)}`)
    }
  }
}
