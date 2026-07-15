import { DEFAULT_AKARI_STATIC_BASE_URL, resolveAkariStaticUrl } from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class AkariStaticHttpApiAxiosHelper {
  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = DEFAULT_AKARI_STATIC_BASE_URL
    }
  }

  resolveUrl(path: string) {
    return resolveAkariStaticUrl(this._http.defaults.baseURL!, path)
  }

  getFile(path: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(this.resolveUrl(path), { signal: options.signal })
  }
}
