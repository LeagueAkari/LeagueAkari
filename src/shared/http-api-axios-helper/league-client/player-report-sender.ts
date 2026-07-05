import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class PlayerReportSenderHttpApi {
  constructor(private _http: AxiosInstance) {}

  getReportedPlayersByGameId(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<string[]>(
      `/lol-player-report-sender/v1/reported-player/gameId/${gameId}`,
      { signal: options.signal }
    )
  }
}
