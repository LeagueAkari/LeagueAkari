import { SgpStatsEndOfGameGame } from '@shared/types/sgp/stats'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import {
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from './patterns'

export class StatsHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEogByGameIdAndPuuid(gameId: number, puuid: string, options: SgpRegionParam = {}) {
    return this._http.get<SgpStatsEndOfGameGame>(
      `/stats/endOfGame/region/${URL_PLACEHOLDER_SUB_ID}/gameId/${gameId}/puuid/${puuid}`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session'
        }
      }
    )
  }
}
