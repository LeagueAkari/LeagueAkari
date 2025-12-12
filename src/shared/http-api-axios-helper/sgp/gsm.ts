import { SgpGsmLedgeRegion, SgpGsmLedgeRegionGame, SpectatorData } from '@shared/types/sgp/gsm'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import {
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from './patterns'

export class GsmHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSpectatorByPuuid(puuid: string, options: SgpRegionParam = {}) {
    return this._http.get<SpectatorData>(
      `/gsm/v1/ledge/spectator/region/${URL_PLACEHOLDER_SUB_ID}/puuid/${puuid}`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session'
        }
      }
    )
  }

  getByPuuid(puuid: string, options: SgpRegionParam = {}) {
    return this._http.get<SgpGsmLedgeRegion>(
      `/gsm/v1/ledge/region/${URL_PLACEHOLDER_SUB_ID}/puuid/${puuid}`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session'
        }
      }
    )
  }

  getByGameId(gameId: number, options: SgpRegionParam = {}) {
    return this._http.get<SgpGsmLedgeRegionGame>(
      `/gsm/v1/ledge/region/${URL_PLACEHOLDER_SUB_ID}/gameId/${gameId}`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session'
        }
      }
    )
  }
}
