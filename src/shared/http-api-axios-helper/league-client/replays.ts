import { ReplayConfiguration, ReplayMetadata } from '@shared/types/league-client/replays'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class ReplaysHttpApi {
  constructor(private _http: AxiosInstance) {}

  getMetadata(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<ReplayMetadata>(`/lol-replays/v1/metadata/${gameId}`, {
      signal: options.signal
    })
  }

  watchRofl(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(
      `/lol-replays/v1/rofls/${gameId}/watch`,
      {
        componentType: 'replay-button_match-history'
      },
      { signal: options.signal }
    )
  }

  downloadRofl(gameId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(
      `/lol-replays/v1/rofls/${gameId}/download`,
      {
        componentType: 'replay-button_match-history'
      },
      { signal: options.signal }
    )
  }

  createMetadata(
    gameId: number,
    data: {
      gameVersion?: string
      gameType?: string
      queueId?: number
      gameEnd?: number
    } = {},
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post<void>(
      `/lol-replays/v2/metadata/${gameId}/create`,
      {
        gameVersion: data.gameVersion,
        gameType: data.gameType,
        queueId: data.queueId,
        gameEnd: data.gameEnd
      },
      { signal: options.signal }
    )
  }

  getConfiguration(options: HttpApiRequestOptions = {}) {
    return this._http.get<ReplayConfiguration>('/lol-replays/v1/configuration', {
      signal: options.signal
    })
  }

  getReplaysPath(options: HttpApiRequestOptions = {}) {
    return this._http.get<string>('/lol-replays/v1/rofls/path', { signal: options.signal })
  }
}
