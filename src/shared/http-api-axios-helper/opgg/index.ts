import type {
  OpggChampionApiMode,
  OpggRankedPosition,
  OpggRegion,
  OpggTierFilter
} from '@shared/types/opgg'
import type { AxiosInstance } from 'axios'

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

    return this._http.get<unknown>(`/api/${region}/champions/${mode}`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getAramChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<unknown>(`/api/${region}/champions/aram`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getArenaChampions(region: OpggRegion, options: OpggArenaChampionRequestOptions = {}) {
    return this._http.get<unknown>(`/api/${region}/champions/arena`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getNexusBlitzChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<unknown>(`/api/${region}/champions/nexus_blitz`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getUrfChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<unknown>(`/api/${region}/champions/urf`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getDoomChampions(region: OpggRegion, options: OpggTieredChampionRequestOptions = {}) {
    return this._http.get<unknown>(`/api/${region}/champions/doom`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getRankedChampion(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggRankedChampionRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<unknown>(`/api/${region}/champions/${mode}/${championId}/${position}`, {
      params: { tier: options.tier, version: options.version, is_more: options.isMore },
      signal: options.signal
    })
  }

  getRankedChampionCounters(
    region: OpggRegion,
    championId: number,
    position: OpggRankedPosition,
    options: OpggRankedRequestOptions = {}
  ) {
    const mode = options.queue === 'flex' ? 'flex' : 'ranked'

    return this._http.get<unknown>(
      `/api/${region}/champions/${mode}/${championId}/${position}/counters`,
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
    return this._http.get<unknown>(`/api/${region}/champions/aram/${championId}/none`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getArenaChampion(
    region: OpggRegion,
    championId: number,
    options: OpggArenaChampionRequestOptions = {}
  ) {
    return this._http.get<unknown>(`/api/${region}/champions/arena/${championId}`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getNexusBlitzChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<unknown>(`/api/${region}/champions/nexus_blitz/${championId}/none`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getUrfChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<unknown>(`/api/${region}/champions/urf/${championId}/none`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getDoomChampion(
    region: OpggRegion,
    championId: number,
    options: OpggTieredChampionRequestOptions = {}
  ) {
    return this._http.get<unknown>(`/api/${region}/champions/doom/${championId}/none`, {
      params: { tier: options.tier, version: options.version },
      signal: options.signal
    })
  }

  getChampionVersions(
    region: OpggRegion,
    mode: OpggChampionApiMode,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<unknown>(`/api/${region}/champions/${mode}/versions`, {
      signal: options.signal
    })
  }

  getAramBalance(options: HttpApiRequestOptions = {}) {
    return this._http.get<unknown>('/api/contents/aram-balance', {
      signal: options.signal
    })
  }

  getAramMayhemChampionAugments(championId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<unknown>(`/api/contents/stats/champions/${championId}/aram-augments`, {
      signal: options.signal
    })
  }

  getAramMayhemTiers(options: HttpApiRequestOptions = {}) {
    return this._http.get<unknown>('/api/contents/tiers', {
      params: { type: 'aram_mayhem' },
      signal: options.signal
    })
  }

  getMetaChampions(options: OpggLocalizedRequestOptions = {}) {
    return this._http.get<unknown>('/api/meta/champions', {
      params: { hl: options.locale },
      signal: options.signal
    })
  }

  getMetaItems(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<unknown>('/api/meta/items', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }

  getMetaRunes(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<unknown>('/api/meta/runes', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }

  getMetaStatMods(options: OpggMetadataRequestOptions = {}) {
    return this._http.get<unknown>('/api/meta/stat-mods', {
      params: { hl: options.locale, version: options.version },
      signal: options.signal
    })
  }
}
