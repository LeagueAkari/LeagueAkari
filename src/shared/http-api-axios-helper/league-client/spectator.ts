import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class SpectatorHttpApi {
  constructor(private _http: AxiosInstance) {}

  launchSpectator(puuid: string, spectatorKey: string, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(
      '/lol-spectator/v1/spectate/launch',
      {
        puuid,
        spectatorKey
      },
      { signal: options.signal }
    )
  }
}
