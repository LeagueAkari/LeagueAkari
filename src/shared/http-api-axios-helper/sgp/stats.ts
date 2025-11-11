import { SgpStatsEndOfGameGame } from '@shared/types/sgp/stats'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'

export class StatsHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEogByGameIdAndPuuid(gameId: number, puuid: string, options: SgpRegionParam) {
    return this._http.get<SgpStatsEndOfGameGame>(
      `/stats/endOfGame/region/{akari:sgpServerSubId}/gameId/${gameId}/puuid/${puuid}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }
}
