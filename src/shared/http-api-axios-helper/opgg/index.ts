import type {
  OpggAramBalanceResponse,
  OpggAramChampionDetailsResponse,
  OpggAramChampionsResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTiersResponse,
  OpggArenaChampionDetailsResponse,
  OpggArenaChampionsResponse,
  OpggChampionApiMode,
  OpggChampionVersionsResponse,
  OpggNexusBlitzChampionDetailsResponse,
  OpggNexusBlitzChampionsResponse,
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionsResponse,
  OpggRankedPosition,
  OpggRegion,
  OpggTierFilter,
  OpggUrfChampionDetailsResponse,
  OpggUrfChampionsResponse
} from '@shared/types/opgg'
import type { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

interface OpggTieredChampionRequestOptions extends HttpApiRequestOptions {
  tier?: OpggTierFilter
  version?: string
}

interface OpggArenaChampionRequestOptions extends HttpApiRequestOptions {
  version?: string
}

export class OpggHttpApiAxiosHelper {
  static BASE_URL = 'https://lol-api-champion.op.gg'

  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = OpggHttpApiAxiosHelper.BASE_URL
    }
  }

  getRankedChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<OpggRankedChampionsResponse>(`/api/${region}/champions/ranked`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getAramChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<OpggAramChampionsResponse>(`/api/${region}/champions/aram`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getArenaChampions(region: OpggRegion, options: OpggArenaChampionRequestOptions = {}) {
    return this._http.get<OpggArenaChampionsResponse>(`/api/${region}/champions/arena`, {
      params: { version: options.version },
      signal: options.signal
    })
  }

  getNexusBlitzChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<OpggNexusBlitzChampionsResponse>(`/api/${region}/champions/nexus_blitz`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getUrfChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<OpggUrfChampionsResponse>(`/api/${region}/champions/urf`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getRankedChampion(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<OpggRankedChampionDetailsResponse>(
      `/api/${region}/champions/ranked/${championId}/${position}`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getAramChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<OpggAramChampionDetailsResponse>(
      `/api/${region}/champions/aram/${championId}/none`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getArenaChampion(
    region: OpggRegion,
    championId: number,
    options: OpggArenaChampionRequestOptions = {}
  ) {
    return this._http.get<OpggArenaChampionDetailsResponse>(
      `/api/${region}/champions/arena/${championId}`,
      {
        params: { version: options.version },
        signal: options.signal
      }
    )
  }

  getNexusBlitzChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<OpggNexusBlitzChampionDetailsResponse>(
      `/api/${region}/champions/nexus_blitz/${championId}/none`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getUrfChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<OpggUrfChampionDetailsResponse>(
      `/api/${region}/champions/urf/${championId}/none`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getChampionVersions(
    region: OpggRegion,
    mode: OpggChampionApiMode,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<OpggChampionVersionsResponse>(
      `/api/${region}/champions/${mode}/versions`,
      { signal: options.signal }
    )
  }

  getAramBalance(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramBalanceResponse>('/api/contents/aram-balance', {
      signal: options.signal
    })
  }

  getAramMayhemChampionAugments(championId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramMayhemChampionAugmentsResponse>(
      `/api/contents/stats/champions/${championId}/aram-augments`,
      { signal: options.signal }
    )
  }

  getAramMayhemTiers(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramMayhemTiersResponse>('/api/contents/tiers', {
      params: { type: 'aram_mayhem' },
      signal: options.signal
    })
  }
}
