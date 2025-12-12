import { SgpSummonerLol } from '@shared/types/sgp/summoner'
import { AxiosInstance } from 'axios'

import { SgpRegionParam } from './dto'
import {
  AKARI_HEADER_FORCE_STREAM_COLLECT,
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from './patterns'

export class SummonerLedgeHttpApi {
  constructor(private _http: AxiosInstance) {}

  postSummonersByPuuids(puuids: string[], options: SgpRegionParam = {}) {
    return this._http.post<SgpSummonerLol[]>(
      `/summoner-ledge/v1/regions/${URL_PLACEHOLDER_SUB_ID}/summoners/puuids`,
      puuids,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'league-session',
          [AKARI_HEADER_FORCE_STREAM_COLLECT]: 'true'
        }
      }
    )
  }
}
