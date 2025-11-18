import { SgpStatsEndOfGameGame } from '@shared/types/sgp/stats'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import { URL_PLACEHOLDER_SUB_ID } from './patterns'

export class StatsHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEogByGameIdAndPuuid(gameId: number, puuid: string, options: SgpRegionParam = {}) {
    return this._http.get<SgpStatsEndOfGameGame>(
      `/stats/endOfGame/region/${URL_PLACEHOLDER_SUB_ID}/gameId/${gameId}/puuid/${puuid}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }
}
