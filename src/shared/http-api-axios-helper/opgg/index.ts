import {
  ModeType,
  OpggAramBalanceResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggChampionBuildResponse,
  OpggChampionsResponse,
  OpggTiersResponse,
  OpggVersionsResponse,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { AxiosInstance } from 'axios'

export class OpggHttpApiAxiosHelper {
  static BASE_URL = 'https://lol-api-champion.op.gg'

  constructor(private _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = OpggHttpApiAxiosHelper.BASE_URL
    }
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

  getVersions(region: RegionType, mode: ModeType, options: { signal?: AbortSignal } = {}) {
    return this._http.get<OpggVersionsResponse>(`/api/${region}/champions/${mode}/versions`, {
      signal: options.signal
    })
  }

  getAramMayhemChampionAugments(championId: number, options: { signal?: AbortSignal } = {}) {
    return this._http.get<OpggAramMayhemChampionAugmentsResponse>(
      `/api/contents/stats/champions/${championId}/aram-augments`,
      {
        signal: options.signal
      }
    )
  }

  getTiers(type: 'aram-mayhem', options: { signal?: AbortSignal } = {}) {
    return this._http.get<OpggTiersResponse>(`/api/contents/tiers`, {
      params: {
        type
      },
      signal: options.signal
    })
  }
}
