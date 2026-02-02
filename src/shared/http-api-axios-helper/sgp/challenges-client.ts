import { AllPlayerData } from '@shared/types/sgp/challenges-client'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import { AKARI_HEADER_SGP_SERVER_ID, AKARI_HEADER_TOKEN_TYPE } from './patterns'

export class ChallengesClientHttpApi {
  constructor(private _http: AxiosInstance) {}

  getAllPlayerData(puuid: string, friends: string[], options: SgpRegionParam = {}) {
    // 非常奇怪的 trailing slash，总之 leave it as is
    return this._http.post<AllPlayerData>(
      `/challenges-client/v2/all-player-data/?puuid=${puuid}`,
      friends,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session'
        }
      }
    )
  }
}
