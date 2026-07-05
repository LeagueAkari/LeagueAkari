import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'
import { AxiosInstance } from 'axios'
import { Readable } from 'stream'

import { SgpRegionParam } from './dto'
import {
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from './patterns'

export interface MatchHistoryQueryParams extends SgpRegionParam {
  startIndex?: number
  count?: number
  tag?: string
  tagsQueryType?: 'AND' | 'OR' | (string & {})
}

export class MatchHistoryQueryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getMatchHistorySummaryByPlayerPuuid(puuid: string, options: MatchHistoryQueryParams = {}) {
    return this._http.get<SgpMatchHistoryLol>(
      `/match-history-query/v1/products/lol/player/${puuid}/SUMMARY`,
      {
        params: {
          startIndex: options.startIndex,
          count: options.count,
          tag: options.tag,
          tagsQueryType: options.tagsQueryType
        },
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'entitlements'
        },
        signal: options.signal
      }
    )
  }

  getGameSummaryByGameId(gameId: number, options: SgpRegionParam = {}) {
    return this._http.get<SgpGameSummaryLol>(
      `/match-history-query/v1/products/lol/${URL_PLACEHOLDER_SUB_ID}_${gameId}/SUMMARY`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'entitlements'
        },
        signal: options.signal
      }
    )
  }

  getGameDetailsByGameId(gameId: number, options: SgpRegionParam = {}) {
    return this._http.get<SgpGameDetailsLol>(
      `/match-history-query/v1/products/lol/${URL_PLACEHOLDER_SUB_ID}_${gameId}/DETAILS`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'entitlements'
        },
        signal: options.signal
      }
    )
  }

  getMatchHistoryReplayStreamByGameId(gameId: number, options: SgpRegionParam = {}) {
    return this._http.get<Readable>(
      `/match-history-query/v3/product/lol/matchId/${URL_PLACEHOLDER_SUB_ID}_${gameId}/infoType/replay`,
      {
        headers: {
          [AKARI_HEADER_SGP_SERVER_ID]: options.__sgpServerId,
          [AKARI_HEADER_TOKEN_TYPE]: 'entitlements'
        },
        responseType: 'stream',
        signal: options.signal
      }
    )
  }
}
