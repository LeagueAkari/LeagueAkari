import axios from 'axios'
import { AxiosRetry } from 'axios-retry'
import { Readable } from 'stream'

import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpGsmLedgeRegion,
  SgpGsmLedgeRegionGame,
  SgpMatchHistoryLol,
  SgpRankedStats,
  SgpStatsEndOfGameGame,
  SgpSummoner,
  SpectatorData
} from './types'

// can only be imported like this
const axiosRetry = require('axios-retry').default as AxiosRetry

export interface SgpServersConfig {
  version: number

  lastUpdate: number

  servers: {
    [region: string]: {
      /**
       * 用于战绩查询的服务器地址
       */
      matchHistory: string | null

      /**
       * 其他通用查询服务器地址
       */
      common: string | null
    }
  }

  serverNames: {
    [locale: string]: {
      [server: string]: string
    }
  }

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现战绩查询
   */
  tencentServerMatchHistoryInteroperability: string[]

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现观战查询
   */
  tencentServerSpectatorInteroperability: string[]

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现召唤师查询
   */
  tencentServerSummonerInteroperability: string[]
}

export class LeagueSgpApi {
  static USER_AGENT = 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)'
  static REQUEST_TIMEOUT = 12500

  // default
  private _sgpServerConfig: SgpServersConfig = {
    version: 0,
    lastUpdate: 0,
    servers: {},
    serverNames: {},
    tencentServerMatchHistoryInteroperability: [],
    tencentServerSpectatorInteroperability: [],
    tencentServerSummonerInteroperability: []
  }

  /**
   * SGP API 需要用户登录的 Session
   */
  private _entitlementToken: string | null = null
  private _leagueSessionToken: string | null = null
  private _http = axios.create({
    headers: {
      'User-Agent': LeagueSgpApi.USER_AGENT
    },
    timeout: LeagueSgpApi.REQUEST_TIMEOUT
  })

  get http() {
    return this._http
  }

  constructor() {
    axiosRetry(this._http, {
      retries: 2
    })
  }

  setSgpServerConfig(config: SgpServersConfig) {
    this._sgpServerConfig = config
  }

  sgpServers() {
    return this._sgpServerConfig
  }

  hasEntitlementsToken() {
    return this._entitlementToken !== null
  }

  hasLeagueSessionToken() {
    return this._leagueSessionToken !== null
  }

  setEntitlementsToken(token: string | null) {
    this._entitlementToken = token
  }

  setLeagueSessionToken(token: string | null) {
    this._leagueSessionToken = token
  }

  private _getSgpServer(sgpServerId: string) {
    const sgpServer = this._sgpServerConfig.servers[sgpServerId.toUpperCase()]
    if (!sgpServer) {
      throw new Error(`unknown sgpServerId: ${sgpServerId}`)
    }

    return sgpServer
  }

  /**
   * 对于腾讯系, 仅保留其 rsoPlatformId
   * @param sgpServerId
   */
  private _getSubId(sgpServerId: string) {
    if (sgpServerId.startsWith('TENCENT')) {
      const [_, rsoPlatformId] = sgpServerId.split('_')
      return rsoPlatformId
    }

    return sgpServerId
  }

  async getMatchHistory(
    sgpServerId: string,
    playerPuuid: string,
    query: {
      start?: number
      count?: number
      tag?: string
      tagsQueryType?: 'AND' | 'OR' | (string & {})
    }
  ) {
    if (!this._entitlementToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.matchHistory) {
      throw new Error(`match history server not found for ${sgpServerId}`)
    }

    return this._http.get<SgpMatchHistoryLol>(
      `/match-history-query/v1/products/lol/player/${playerPuuid}/SUMMARY`,
      {
        baseURL: sgpServer.matchHistory,
        headers: {
          Authorization: `Bearer ${this._entitlementToken}`
        },
        params: {
          startIndex: query.start,
          count: query.count,
          tag: query.tag,
          tagsQueryType: query.tagsQueryType
        }
      }
    )
  }

  getGameSummary(sgpServerId: string, gameId: number) {
    if (!this._entitlementToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.matchHistory) {
      throw new Error(`match history server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SgpGameSummaryLol>(
      `/match-history-query/v1/products/lol/${subId.toUpperCase()}_${gameId}/SUMMARY`,
      {
        baseURL: sgpServer.matchHistory,
        headers: {
          Authorization: `Bearer ${this._entitlementToken}`
        }
      }
    )
  }

  getGameDetails(sgpServerId: string, gameId: number) {
    if (!this._entitlementToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.matchHistory) {
      throw new Error(`match history server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SgpGameDetailsLol>(
      `/match-history-query/v1/products/lol/${subId.toUpperCase()}_${gameId}/DETAILS`,
      {
        baseURL: sgpServer.matchHistory,
        headers: {
          Authorization: `Bearer ${this._entitlementToken}`
        }
      }
    )
  }

  getRankedStats(platformId: string, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(platformId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${platformId}`)
    }

    return this._http.get<SgpRankedStats>(`/leagues-ledge/v2/rankedStats/puuid/${puuid}`, {
      baseURL: sgpServer.common,
      headers: {
        Authorization: `Bearer ${this._leagueSessionToken}`
      }
    })
  }

  getSummonerByPuuid(sgpServerId: string, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.post<SgpSummoner[]>(
      `/summoner-ledge/v1/regions/${subId.toLowerCase()}/summoners/puuids`,
      [puuid],
      {
        baseURL: sgpServer.common,
        headers: {
          Authorization: `Bearer ${this._leagueSessionToken}`
        }
      }
    )
  }

  getSpectatorGameflowByPuuid(sgpServerId: string, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SpectatorData>(`/gsm/v1/ledge/spectator/region/${subId}/puuid/${puuid}`, {
      baseURL: sgpServer.common,
      headers: {
        Authorization: `Bearer ${this._leagueSessionToken}`
      }
    })
  }

  getGsmLedgeRegionPlayerByPuuid(sgpServerId: string, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SgpGsmLedgeRegion>(`/gsm/v1/ledge/region/${subId}/puuid/${puuid}`, {
      baseURL: sgpServer.common,
      headers: {
        Authorization: `Bearer ${this._leagueSessionToken}`
      }
    })
  }

  getGsmLedgeRegionPlayerByGameId(sgpServerId: string, gameId: number) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SgpGsmLedgeRegionGame>(`/gsm/v1/ledge/region/${subId}/gameId/${gameId}`, {
      baseURL: sgpServer.common,
      headers: {
        Authorization: `Bearer ${this._leagueSessionToken}`
      }
    })
  }

  getStatsEndOfGameGameByGameIdAndPuuid(sgpServerId: string, gameId: number, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<SgpStatsEndOfGameGame>(
      `/stats/endOfGame/region/${subId}/gameId/${gameId}/puuid/${puuid}`,
      {
        baseURL: sgpServer.common,
        headers: {
          Authorization: `Bearer ${this._leagueSessionToken}`
        }
      }
    )
  }

  getMatchHistoryReplayStream(sgpServerId: string, gameId: number) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.matchHistory) {
      throw new Error(`match history server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get<Readable>(
      `/match-history-query/v3/product/lol/matchId/${subId.toUpperCase()}_${gameId}/infoType/replay`,
      {
        baseURL: sgpServer.matchHistory,
        headers: {
          Authorization: `Bearer ${this._leagueSessionToken}`
        },
        responseType: 'stream'
      }
    )
  }

  getEndOfGameStats(sgpServerId: string, gameId: number, puuid: string) {
    if (!this._leagueSessionToken) {
      throw new Error('jwt token is not set')
    }

    const sgpServer = this._getSgpServer(sgpServerId)

    if (!sgpServer.common) {
      throw new Error(`common server not found for ${sgpServerId}`)
    }

    const subId = this._getSubId(sgpServerId)

    return this._http.get(`/stats/endOfGame/region/${subId}/gameId/${gameId}/puuid/${puuid}`, {
      baseURL: sgpServer.common,
      headers: {
        Authorization: `Bearer ${this._leagueSessionToken}`
      }
    })
  }
}
