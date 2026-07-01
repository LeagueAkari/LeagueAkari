import { AxiosInstance } from 'axios'

export class SpectatorHttpApi {
  constructor(private _http: AxiosInstance) {}

  launchSpectator(puuid: string, spectatorKey: string) {
    return this._http.post<void>('/lol-spectator/v1/spectate/launch', {
      puuid,
      spectatorKey
    })
  }
}
