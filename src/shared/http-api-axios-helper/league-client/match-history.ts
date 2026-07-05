import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class MatchHistoryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentSummonerMatchHistory(options: HttpApiRequestOptions = {}) {
    return this._http.get<MatchHistory>(
      '/lol-match-history/v1/products/lol/current-summoner/matches',
      { signal: options.signal }
    )
  }

  getMatchHistory(
    puuid: string,
    begIndex: number = 0,
    endIndex: number = 19,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<MatchHistory>(`/lol-match-history/v1/products/lol/${puuid}/matches`, {
      signal: options.signal,
      params: {
        begIndex,
        endIndex
      }
    })
  }

  getGame(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<Game>(`/lol-match-history/v1/games/${gameId}`, { signal: options.signal })
  }

  getTimeline(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<GameTimeline>(`/lol-match-history/v1/game-timelines/${gameId}`, {
      signal: options.signal
    })
  }
}
