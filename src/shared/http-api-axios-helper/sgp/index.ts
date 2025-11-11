import { AxiosInstance } from 'axios'

import { GsmHttpApi } from './gsm'
import { LeaguesLedgeHttpApi } from './leagues-ledge'
import { MatchHistoryQueryHttpApi } from './match-history-query'
import { StatsHttpApi } from './stats'
import { SummonerLedgeHttpApi } from './summoner-ledge'

/**
 * 注意：可以注意到部分 API 使用占位符 `{akari:sgpServerSubId}` 来表示所属子区，这实际上专属于 League Akari 的抽象层
 *
 * 它用于处理一个区域服务器包含若干子服务器，且 SGP API 又要求传入子区 ID 的情况
 *
 * 特殊 X-Akari- 开头的 Header 用于指导代理如何正确转发并处理这些请求
 */
export class SgpHttpApiAxiosHelper {
  public readonly matchHistoryQuery: MatchHistoryQueryHttpApi
  public readonly gsm: GsmHttpApi
  public readonly leaguesLedge: LeaguesLedgeHttpApi
  public readonly stats: StatsHttpApi
  public readonly summonerLedge: SummonerLedgeHttpApi

  constructor(private _http: AxiosInstance) {
    this.matchHistoryQuery = new MatchHistoryQueryHttpApi(this._http)
    this.gsm = new GsmHttpApi(this._http)
    this.leaguesLedge = new LeaguesLedgeHttpApi(this._http)
    this.stats = new StatsHttpApi(this._http)
    this.summonerLedge = new SummonerLedgeHttpApi(this._http)
  }
}

export const URL_PLACEHOLDER_SUB_ID = '{akari:sgpServerSubId}'
export const AKARI_HEADER_SGP_SERVER_ID = 'X-Akari-Sgp-Server-Id'
export const AKARI_HEADER_TOKEN_TYPE = 'X-Akari-Token-Type'
