import { USER_AGENT } from '@shared/constants/common'
import axios from 'axios'
import { AxiosRetry } from 'axios-retry'
import axiosRetry from 'axios-retry'

import {
  ModeType,
  OpggAramBalanceResponse,
  OpggChampionBuildResponse,
  OpggChampionsResponse,
  OpggVersionsResponse,
  PositionType,
  RegionType,
  TierType
} from './types2'

const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null

const _axiosRetry: AxiosRetry = isNodeEnvironment ? require('axios-retry').default : axiosRetry

export class OpggDataApi {
  static BASE_URL = 'https://lol-api-champion.op.gg'

  private _http = axios.create({
    baseURL: OpggDataApi.BASE_URL,
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  get http() {
    return this._http
  }

  constructor() {
    _axiosRetry(this._http, {
      retries: 2
    })
  }

  getRegionChampionModeVersions(
    region: RegionType,
    mode: ModeType,
    options: {
      signal?: AbortSignal
    } = {}
  ) {
    return this._http.get<OpggVersionsResponse>(`/api/${region}/champions/${mode}/versions`, {
      signal: options.signal
    })
  }

  getChampions(
    region: RegionType,
    mode: ModeType,
    options: {
      tier?: TierType
      version?: string
      signal?: AbortSignal
    } = {}
  ) {
    return this._http.get<OpggChampionsResponse>(`/api/${region}/champions/${mode}`, {
      params: {
        tier: options.tier,
        version: options.version
      },
      signal: options.signal
    })
  }

  getChampion(
    region: RegionType,
    mode: ModeType,
    championId: number,
    position?: PositionType | null,
    options: {
      tier?: TierType
      version?: string
      signal?: AbortSignal
    } = {}
  ) {
    let url: string
    if (mode === 'arena') {
      url = `/api/${region}/champions/${mode}/${championId}`
    } else if (mode === 'aram') {
      url = `/api/${region}/champions/${mode}/${championId}/none`
    } else {
      url = `/api/${region}/champions/${mode}/${championId}/${position ?? 'none'}`
    }

    return this._http.get<OpggChampionBuildResponse>(url, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getAramBalance() {
    return this._http.get<OpggAramBalanceResponse>('/api/contents/aram-balance')
  }
}
