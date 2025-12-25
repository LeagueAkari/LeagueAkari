import { AxiosInstance } from 'axios'

export class PlayerReportSenderHttpApi {
  constructor(private _http: AxiosInstance) {}

  getReportedPlayersByGameId(gameId: number) {
    return this._http.get<string[]>(`/lol-player-report-sender/v1/reported-player/gameId/${gameId}`)
  }
}
