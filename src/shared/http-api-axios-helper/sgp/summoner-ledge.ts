import { SgpSummoner } from '@shared/types/sgp/summoner'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import { URL_PLACEHOLDER_SUB_ID } from './patterns'

export class SummonerLedgeHttpApi {
  constructor(private _http: AxiosInstance) {}

  postSummonersByPuuids(puuids: string[], options: SgpRegionParam = {}) {
    return this._http.post<SgpSummoner[]>(
      `/summoner-ledge/v1/regions/${URL_PLACEHOLDER_SUB_ID}/summoners/puuids`,
      puuids,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }
}
