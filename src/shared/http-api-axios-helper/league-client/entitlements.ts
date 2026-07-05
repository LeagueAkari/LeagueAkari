import { EntitlementsToken } from '@shared/types/league-client/entitlements'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class EntitlementsHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEntitlementsToken(options: HttpApiRequestOptions = {}) {
    return this._http.get<EntitlementsToken>('/entitlements/v1/token', { signal: options.signal })
  }
}
