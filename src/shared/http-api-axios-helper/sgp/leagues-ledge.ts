import { SgpRankedStats } from '@shared/types/sgp/ranked'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'

export class LeaguesLedgeHttpApi {
  constructor(private _http: AxiosInstance) {}

  /**
   * 注：此 API 无法跨区
   */
  getRankedStatsByPuuid(puuid: string, options: SgpRegionParam = {}) {
    return this._http.get<SgpRankedStats>(`/leagues-ledge/v2/rankedStats/puuid/${puuid}`, {
      headers: {
        'X-Akari-Sgp-Server-Id': options.__sgpServerId,
        'X-Akari-Token-Type': 'league-session'
      }
    })
  }
}
