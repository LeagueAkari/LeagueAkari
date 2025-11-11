import { SgpSummoner } from '@shared/types/sgp/summoner'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'

export class SummonerLedgeHttpApi {
  constructor(private _http: AxiosInstance) {}

  postSummonersByPuuids(puuids: string[], options: SgpRegionParam) {
    return this._http.post<SgpSummoner[]>(
      `/summoner-ledge/v1/regions/{akari:sgpServerSubId}/summoners/puuids`,
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
