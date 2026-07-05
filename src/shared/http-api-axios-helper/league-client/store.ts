import { GiftableFriend } from '@shared/types/league-client/store'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class StoreHttpApi {
  constructor(private _http: AxiosInstance) {}

  getGiftableFriends(options: HttpApiRequestOptions = {}) {
    return this._http.get<GiftableFriend[]>('/lol-store/v1/giftablefriends', {
      signal: options.signal
    })
  }
}
