import {
  ModeType,
  OpggAramBalanceResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTierResponse,
  OpggChampionBuildResponse,
  OpggChampionsResponse,
  OpggTiersResponse,
  OpggVersionsResponse,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

interface OpggChampionOptions extends HttpApiRequestOptions {
  tier?: TierType
  version?: string
}

export class OpggHttpApiAxiosHelper {
  static BASE_URL = 'https://lol-api-champion.op.gg'

  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = OpggHttpApiAxiosHelper.BASE_URL
    }
  }

  getChampions(region: RegionType, mode: ModeType, options: OpggChampionOptions = {}) {
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
    options: OpggChampionOptions = {}
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

  getAramBalance(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramBalanceResponse>('/api/contents/aram-balance', {
      signal: options.signal
    })
  }

  getVersions(region: RegionType, mode: ModeType, options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggVersionsResponse>(`/api/${region}/champions/${mode}/versions`, {
      signal: options.signal
    })
  }

  getAramMayhemChampionAugments(championId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramMayhemChampionAugmentsResponse>(
      `/api/contents/stats/champions/${championId}/aram-augments`,
      {
        signal: options.signal
      }
    )
  }

  getAramMayhemTiers(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramMayhemTierResponse>(`/api/contents/tiers`, {
      params: {
        type: 'aram_mayhem'
      },
      signal: options.signal
    })
  }

  getTiers(type: 'aram_mayhem', options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggTiersResponse>(`/api/contents/tiers`, {
      params: {
        type
      },
      signal: options.signal
    })
  }
}
