import type {
  OpggAramBalanceResponse,
  OpggAramChampionDetailsResponse,
  OpggAramChampionsResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTiersResponse,
  OpggArenaChampionDetailsResponse,
  OpggArenaChampionsResponse,
  OpggBrawlTiersResponse,
  OpggChampionApiMode,
  OpggChampionMatchupResponse,
  OpggChampionSynergiesResponse,
  OpggChampionVersionsResponse,
  OpggDoomChampionDetailsResponse,
  OpggDoomChampionsResponse,
  OpggMetaAramAugmentsResponse,
  OpggMetaChampionNamesResponse,
  OpggMetaChampionsResponse,
  OpggMetaItemsResponse,
  OpggMetaRunePagesResponse,
  OpggMetaRunesResponse,
  OpggMetaStatModsResponse,
  OpggMetaVersionsResponse,
  OpggNexusBlitzChampionDetailsResponse,
  OpggNexusBlitzChampionsResponse,
  OpggRankedChampionCountersResponse,
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionExtendedDetailsResponse,
  OpggRankedChampionSummaryResponse,
  OpggRankedChampionsResponse,
  OpggRankedPosition,
  OpggRegion,
  OpggRoleCode,
  OpggTierFilter,
  OpggTierStatisticsResponse,
  OpggUrfChampionDetailsResponse,
  OpggUrfChampionsResponse
} from '@shared/types/opgg'
import type { AxiosInstance, AxiosResponse } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

interface OpggTieredChampionRequestOptions extends HttpApiRequestOptions {
  tier?: OpggTierFilter
  version?: string
}

interface OpggArenaChampionRequestOptions extends HttpApiRequestOptions {
  tier?: 'all'
  version?: string
}

interface OpggRankedRequestOptions extends OpggTieredChampionRequestOptions {
  queue?: 'solo' | 'flex'
}

interface OpggRankedChampionRequestOptions extends OpggRankedRequestOptions {
  isMore?: boolean
  targetChampionId?: number
  role?: OpggRoleCode
}

interface OpggLocalizedRequestOptions extends HttpApiRequestOptions {
  locale?: string
}

interface OpggMetadataRequestOptions extends OpggLocalizedRequestOptions {
  version?: string
}

export class OpggHttpApiAxiosHelper {
  static BASE_URL = 'https://lol-api-champion.op.gg'

  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = OpggHttpApiAxiosHelper.BASE_URL
    }
  }

  getRankedChampions(region: OpggRegion, options: OpggRankedRequestOptions = {}) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggRankedChampionsResponse>(`/api/${region}/champions/${mode}`, {
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
      params: { tier: options.tier, version: options.version },
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

  getDoomChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<OpggDoomChampionsResponse>(`/api/${region}/champions/doom`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getRankedChampion(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggRankedChampionRequestOptions & { isMore: true }
  ): Promise<AxiosResponse<OpggRankedChampionExtendedDetailsResponse>>

  getRankedChampion(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options?: OpggRankedChampionRequestOptions
  ): Promise<AxiosResponse<OpggRankedChampionDetailsResponse>>

  getRankedChampion(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggRankedChampionRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggRankedChampionDetailsResponse>(
      `/api/${region}/champions/${mode}/${championId}/${position}`,
      {
        params: {
          tier: options.tier,
          version: options.version,
          is_more: options.isMore,
          target_champion: options.targetChampionId,
          role: options.role
        },
        signal: options.signal
      }
    )
  }

  getRankedChampionCounters(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggRankedRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggRankedChampionCountersResponse>(
      `/api/${region}/champions/${mode}/${championId}/${position}/counters`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getRankedChampionSummary(
    region: OpggRegion,
    championId: number,
    options: OpggRankedRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggRankedChampionSummaryResponse>(
      `/api/${region}/champions/${mode}/${championId}/summaries`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getRankedChampionMatchup(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    targetChampionId: number,
    options: OpggRankedRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggChampionMatchupResponse>(
      `/api/${region}/champions/${mode}/${championId}/${position}/counters/${targetChampionId}`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getRankedChampionSynergies(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    synergyPosition: OpggRankedPosition,
    options: OpggRankedRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<OpggChampionSynergiesResponse>(
      `/api/${region}/champions/${mode}/${championId}/${position}/synergies/${synergyPosition}`,
      {
        params: { tier: options.tier, version: options.version },
        signal: options.signal
      }
    )
  }

  getRankedTierStatistics(region: OpggRegion, options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggTierStatisticsResponse>(
      `/api/${region}/champions/ranked/tier-statistics`,
      {
        params: { period: 'month' },
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
        params: { tier: options.tier, version: options.version },
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

  getDoomChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<OpggDoomChampionDetailsResponse>(
      `/api/${region}/champions/doom/${championId}/none`,
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
      {
        signal: options.signal
      }
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
      {
        signal: options.signal
      }
    )
  }

  getAramMayhemTiers(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggAramMayhemTiersResponse>('/api/contents/tiers', {
      params: { type: 'aram_mayhem' },
      signal: options.signal
    })
  }

  getMetaChampions(options: OpggLocalizedRequestOptions = {}) {
    return this._http.get<OpggMetaChampionsResponse>('/api/meta/champions', {
      params: { hl: options.locale },
      signal: options.signal
    })
  }

  getMetaItems(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<OpggMetaItemsResponse>('/api/meta/items', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }

  getMetaRunes(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<OpggMetaRunesResponse>('/api/meta/runes', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }

  getMetaStatMods(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<OpggMetaStatModsResponse>('/api/meta/stat-mods', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }

  getBrawlTiers(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggBrawlTiersResponse>('/api/contents/tiers', {
      signal: options.signal
    })
  }

  getMetaChampionNames(options: OpggLocalizedRequestOptions = {}) {
    return this._http.get<OpggMetaChampionNamesResponse>('/api/meta/champion-names', {
      params: { hl: options.locale },
      signal: options.signal
    })
  }

  getMetaRunePages(options: OpggLocalizedRequestOptions = {}) {
    return this._http.get<OpggMetaRunePagesResponse>('/api/meta/rune-pages', {
      params: { hl: options.locale },
      signal: options.signal
    })
  }

  getMetaAramAugments(options: OpggLocalizedRequestOptions = {}) {
    return this._http.get<OpggMetaAramAugmentsResponse>('/api/meta/aram-augments', {
      params: { hl: options.locale },
      signal: options.signal
    })
  }

  getMetaVersions(options: HttpApiRequestOptions = {}) {
    return this._http.get<OpggMetaVersionsResponse>('/api/meta/versions', {
      signal: options.signal
    })
  }
}
