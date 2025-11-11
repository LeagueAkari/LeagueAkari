import { SgpGsmLedgeRegion, SgpGsmLedgeRegionGame, SpectatorData } from '@shared/types/sgp/gsm'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'

export class GsmHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSpectatorByPuuid(puuid: string, options: SgpRegionParam) {
    return this._http.get<SpectatorData>(
      `/gsm/v1/ledge/spectator/region/{akari:sgpServerSubId}/puuid/${puuid}`,
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
      `/gsm/v1/ledge/region/{akari:sgpServerSubId}/puuid/${puuid}`,
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
      `/gsm/v1/ledge/region/{akari:sgpServerSubId}/gameId/${gameId}`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'league-session'
        }
      }
    )
  }
}
