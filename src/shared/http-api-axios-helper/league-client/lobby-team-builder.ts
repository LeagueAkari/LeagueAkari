import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class LobbyTeamBuilderHttpApi {
  constructor(private _http: AxiosInstance) {}

  getChampSelectSubsetChampionList(options: HttpApiRequestOptions = {}) {
    return this._http.get<number[]>(
      '/lol-lobby-team-builder/champ-select/v1/subset-champion-list',
      { signal: options.signal }
    )
  }
}
