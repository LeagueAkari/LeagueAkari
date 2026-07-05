import {
  PerkInventory,
  PerkPage,
  RecommendPage,
  RecommendPositions
} from '@shared/types/league-client/perks'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export interface PostPerkDto {
  name: string
  isEditable: boolean
  primaryStyleId: string
}

export interface PutPageDto {
  isTemporary: boolean
  runeRecommendationId: string
  recommendationChampionId: number
  isRecommendationOverride: boolean
  recommendationIndex: number
  quickPlayChampionids: number[]
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  name: string
  order: number
  id: number
}

export class PerksHttpApi {
  constructor(private _http: AxiosInstance) {}

  postPerkPage(perkData: PostPerkDto, options: HttpApiRequestOptions = {}) {
    return this._http.post<PerkPage>('/lol-perks/v1/pages/', perkData, { signal: options.signal })
  }

  getPerkInventory(options: HttpApiRequestOptions = {}) {
    return this._http.get<PerkInventory>('/lol-perks/v1/inventory', { signal: options.signal })
  }

  getPerkPages(options: HttpApiRequestOptions = {}) {
    return this._http.get<PerkPage[]>('/lol-perks/v1/pages', { signal: options.signal })
  }

  putPage(perkData: Partial<PutPageDto>, options: HttpApiRequestOptions = {}) {
    return this._http.put(`/lol-perks/v1/pages/${perkData.id}`, perkData, {
      signal: options.signal
    })
  }

  putCurrentPage(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.put('/lol-perks/v1/currentpage', id, {
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  getRecommendedChampionPositions(options: HttpApiRequestOptions = {}) {
    return this._http.get<RecommendPositions>('/lol-perks/v1/recommended-champion-positions', {
      signal: options.signal
    })
  }

  getRecommendedPagesPosition(championId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-perks/v1/recommended-pages-position/champion/${championId}`, {
      signal: options.signal
    })
  }

  postRecommendedPagePosition(
    championId: number,
    position: string,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post(
      `/lol-perks/v1/recommended-pages-position/champion/${championId}/position/${position}`,
      undefined,
      { signal: options.signal }
    )
  }

  getRecommendedPages(
    championId: number,
    position: string,
    mapId: number,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<RecommendPage[]>(
      `/lol-perks/v1/recommended-pages/champion/${championId}/position/${position}/map/${mapId}`,
      { signal: options.signal }
    )
  }

  /**
   * 是否系统级别自动选择
   * @returns
   */
  getRuneRecommenderAutoSelect(options: HttpApiRequestOptions = {}) {
    return this._http.get<boolean>(`/lol-perks/v1/rune-recommender-auto-select`, {
      signal: options.signal
    })
  }

  /**
   * 开启系统级别自动选择
   * @returns
   */
  postRuneRecommenderAutoSelect(data: object, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-perks/v1/rune-recommender-auto-select`, data, {
      signal: options.signal
    })
  }
}
