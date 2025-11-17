import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpSummoner, SpectatorData } from '@shared/data-sources/sgp/types'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import { Game, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import axios from 'axios'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from './store'

const MAIN_SHARD_NAMESPACE = 'sgp-main'

@Shard(SgpRenderer.id)
export class SgpRenderer implements IAkariShardInitDispose {
  static id = 'sgp-renderer'

  public readonly _http = axios.create({
    baseURL: 'akari://sgp',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
  public readonly api: SgpHttpApiAxiosHelper

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer
  ) {
    this.api = new SgpHttpApiAxiosHelper(this._http)
  }

  getMatchHistoryLcuFormat(
    playerPuuid: string,
    query: {
      start?: number
      count?: number
      tag?: string
      tagsQueryType?: 'AND' | 'OR' | (string & {})
    },
    sgpServerId?: string
  ) {
    return this._ipc.call<MatchHistory>(
      MAIN_SHARD_NAMESPACE,
      'getMatchHistoryLcuFormat',
      playerPuuid,
      query,
      sgpServerId
    )
  }

  getGameSummaryLcuFormat(gameId: number, sgpServerId?: string) {
    return this._ipc.call<Game>(
      MAIN_SHARD_NAMESPACE,
      'getGameSummaryLcuFormat',
      gameId,
      sgpServerId
    )
  }

  getSpectatorGameflow(puuid: string, sgpServerId?: string) {
    return this._ipc.call<SpectatorData>(
      MAIN_SHARD_NAMESPACE,
      'getSpectatorGameflow',
      puuid,
      sgpServerId
    )
  }

  getSummonerLcuFormat(puuid: string, sgpServerId?: string) {
    return this._ipc.call<SummonerInfo | null>(
      MAIN_SHARD_NAMESPACE,
      'getSummonerLcuFormat',
      puuid,
      sgpServerId
    )
  }

  getSummoner(puuid: string, sgpServerId?: string): Promise<SgpSummoner | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getSummoner', puuid, sgpServerId)
  }

  getGsmLedgeRegionPlayerByPuuid(puuid: string, sgpServerId?: string) {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'getGsmLedgeRegionPlayerByPuuid',
      puuid,
      sgpServerId
    )
  }

  getStatsEndOfGameGameByGameIdAndPuuid(gameId: number, puuid: string, sgpServerId?: string) {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'getStatsEndOfGameGameByGameIdAndPuuid',
      gameId,
      puuid,
      sgpServerId
    )
  }

  getGsmLedgeRegionPlayerByGameId(gameId: number, sgpServerId?: string) {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'getGsmLedgeRegionPlayerByGameId',
      gameId,
      sgpServerId
    )
  }

  async onInit() {
    const store = useSgpStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'data', store.data)

    // @ts-ignore
    window.sgpApi = this.api
  }
}
