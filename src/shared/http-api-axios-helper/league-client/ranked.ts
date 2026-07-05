import { RankedStats } from '@shared/types/league-client/ranked'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class RankedHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentRankedStats(options: HttpApiRequestOptions = {}) {
    return this._http.get<RankedStats>('/lol-ranked/v1/current-ranked-stats', {
      signal: options.signal
    })
  }

  getRankedStats(puuid: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<RankedStats>(`/lol-ranked/v1/ranked-stats/${puuid}`, {
      signal: options.signal
    })
  }

  acknowledgeEosNotification(id: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-ranked/v1/eos-notifications/${id}/acknowledge`, undefined, {
      signal: options.signal
    })
  }

  acknowledgeNotification(id: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-ranked/v1/notifications/${id}/acknowledge`, undefined, {
      signal: options.signal
    })
  }
}
