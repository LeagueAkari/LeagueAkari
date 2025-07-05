import { ReplayConfiguration, ReplayMetadata } from '@shared/types/league-client/replays'
import { AxiosInstance } from 'axios'

export class ReplaysHttpApi {
  constructor(private _http: AxiosInstance) {}

  getMetadata(gameId: number) {
    return this._http.get<ReplayMetadata>(`/lol-replays/v1/metadata/${gameId}`)
  }

  watchRofl(gameId: number) {
    return this._http.post<void>(`/lol-replays/v1/rofls/${gameId}/watch`, {
      componentType: 'replay-button_match-history'
    })
  }

  downloadRofl(gameId: number) {
    return this._http.post<void>(`/lol-replays/v1/rofls/${gameId}/download`, {
      componentType: 'replay-button_match-history'
    })
  }

  createMetadata(
    gameId: number,
    data: {
      gameVersion?: string
      gameType?: string
      queueId?: number
      gameEnd?: number
    } = {}
  ) {
    return this._http.post<void>(`/lol-replays/v2/metadata/${gameId}/create`, {
      gameVersion: data.gameVersion,
      gameType: data.gameType,
      queueId: data.queueId,
      gameEnd: data.gameEnd
    })
  }

  getConfiguration() {
    return this._http.get<ReplayConfiguration>('/lol-replays/v1/configuration')
  }

  getReplaysPath() {
    return this._http.get<string>('/lol-replays/v1/rofls/path')
  }
}
