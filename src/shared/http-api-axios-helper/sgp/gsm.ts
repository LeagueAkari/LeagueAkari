import { SgpGsmLedgeRegion, SgpGsmLedgeRegionGame, SpectatorData } from '@shared/types/sgp/gsm'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import { URL_PLACEHOLDER_SUB_ID } from './patterns'

export class GsmHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSpectatorByPuuid(puuid: string, options: SgpRegionParam) {
    return this._http.get<SpectatorData>(
      `/gsm/v1/ledge/spectator/region/${URL_PLACEHOLDER_SUB_ID}/puuid/${puuid}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }

  getByPuuid(puuid: string, options: SgpRegionParam) {
    return this._http.get<SgpGsmLedgeRegion>(
      `/gsm/v1/ledge/region/${URL_PLACEHOLDER_SUB_ID}/puuid/${puuid}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }

  getByGameId(gameId: number, options: SgpRegionParam) {
    return this._http.get<SgpGsmLedgeRegionGame>(
      `/gsm/v1/ledge/region/${URL_PLACEHOLDER_SUB_ID}/gameId/${gameId}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }
}
