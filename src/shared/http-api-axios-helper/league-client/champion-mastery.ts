import { Mastery, PlayerChampionMastery } from '@shared/types/league-client/champion-mastery'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class ChampionMasteryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getPlayerChampionMasteryTopN(puuid: string, count = 3, options: HttpApiRequestOptions = {}) {
    return this._http.post<PlayerChampionMastery>(
      `/lol-champion-mastery/v1/${puuid}/champion-mastery/top`,
      { skipCache: true },
      { signal: options.signal, params: { count } }
    )
  }

  getPlayerChampionMastery(puuid: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<Mastery[]>(`/lol-champion-mastery/v1/${puuid}/champion-mastery`, {
      signal: options.signal
    })
  }

  ackNotifications(options: HttpApiRequestOptions = {}) {
    return this._http.post<void>('/lol-champion-mastery/v1/notifications/ack', undefined, {
      signal: options.signal
    })
  }
}
