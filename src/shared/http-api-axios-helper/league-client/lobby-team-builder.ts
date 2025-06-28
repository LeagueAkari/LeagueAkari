import { AxiosInstance } from 'axios'

export class LobbyTeamBuilderHttpApi {
  constructor(private _http: AxiosInstance) {}

  getChampSelectSubsetChampionList() {
    return this._http.get<number[]>('/lol-lobby-team-builder/champ-select/v1/subset-champion-list')
  }
}
