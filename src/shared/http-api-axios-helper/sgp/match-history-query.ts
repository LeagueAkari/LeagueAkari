import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'
import { AxiosInstance } from 'axios'
import { Readable } from 'stream'

import { SgpRegionParam } from './dto'
import { URL_PLACEHOLDER_SUB_ID } from './patterns'

export interface MatchHistoryQueryParams extends SgpRegionParam {
  startIndex?: number
  count?: number
  tag?: string
  tagsQueryType?: 'AND' | 'OR' | (string & {})
}

export class MatchHistoryQueryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getMatchHistorySummaryByPlayerPuuid(puuid: string, options: MatchHistoryQueryParams) {
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
          'X-Akari-Region': options.__sgpServerId,
          'X-Akari-Token-Type': 'entitlements'
        }
      }
    )
  }

  getGameSummaryByGameId(gameId: number, options: SgpRegionParam) {
    return this._http.get<SgpGameSummaryLol>(
      `/match-history-query/v1/products/lol/${URL_PLACEHOLDER_SUB_ID}_${gameId}/SUMMARY`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'entitlements'
        }
      }
    )
  }

  getGameDetailsByGameId(gameId: number, options: SgpRegionParam) {
    return this._http.get<SgpGameDetailsLol>(
      `/match-history-query/v1/products/lol/${URL_PLACEHOLDER_SUB_ID}_${gameId}/DETAILS`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'entitlements'
        }
      }
    )
  }

  getMatchHistoryReplayStreamByGameId(gameId: number, options: SgpRegionParam) {
    return this._http.get<Readable>(
      `/match-history-query/v3/product/lol/matchId/${URL_PLACEHOLDER_SUB_ID}_${gameId}/infoType/replay`,
      {
        headers: {
          'X-Akari-Sgp-Server-Id': options.__sgpServerId,
          'X-Akari-Token-Type': 'entitlements'
        },
        responseType: 'stream'
      }
    )
  }
}
