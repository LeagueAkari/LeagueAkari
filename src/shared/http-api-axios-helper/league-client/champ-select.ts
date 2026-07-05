import {
  CarouselSkins,
  ChampSelectSession,
  ChampSelectSummoner,
  GridChamp,
  MySelection,
  OngoingChampionSwap,
  SkinSelectorInfo
} from '@shared/types/league-client/champ-select'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class ChampSelectHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSession(options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampSelectSession>('/lol-champ-select/v1/session', {
      signal: options.signal
    })
  }

  getAllGridChamps(options: HttpApiRequestOptions = {}) {
    return this._http.get<GridChamp[]>('/lol-champ-select/v1/all-grid-champions', {
      signal: options.signal
    })
  }

  getGridChamp(champId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<GridChamp>(`/lol-champ-select/v1/grid-champions/${champId}`, {
      signal: options.signal
    })
  }

  action(
    actionId: string | number,
    data: {
      championId?: number
      completed?: boolean
      type?: string
    },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.patch(`/lol-champ-select/v1/session/actions/${actionId}`, data, {
      signal: options.signal
    })
  }

  pickOrBan(
    championId: number,
    completed: boolean,
    type: 'pick' | 'ban',
    actionId: number,
    options: HttpApiRequestOptions = {}
  ) {
    return this.action(actionId, { championId, completed, type }, options)
  }

  intentChampion(actionId: number, championId: number, options: HttpApiRequestOptions = {}) {
    return this.action(actionId, { championId }, options)
  }

  benchSwap(champId: string | number, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(`/lol-champ-select/v1/session/bench/swap/${champId}`, undefined, {
      signal: options.signal
    })
  }

  declineChampionSwap(tradeId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-champ-select/v1/session/champion-swaps/${tradeId}/decline`,
      undefined,
      { signal: options.signal }
    )
  }

  acceptChampionSwap(tradeId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-champ-select/v1/session/champion-swaps/${tradeId}/accept`,
      undefined,
      { signal: options.signal }
    )
  }

  cancelChampionSwap(tradeId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-champ-select/v1/session/champion-swaps/${tradeId}/cancel`,
      undefined,
      { signal: options.signal }
    )
  }

  requestChampionSwap(tradeId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-champ-select/v1/session/champion-swaps/${tradeId}/request`,
      undefined,
      { signal: options.signal }
    )
  }

  acceptSwap(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(` /lol-champ-select/v1/session/swaps/${id}/accept`, undefined, {
      signal: options.signal
    })
  }

  declineSwap(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/decline`, undefined, {
      signal: options.signal
    })
  }

  cancelSwap(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/cancel`, undefined, {
      signal: options.signal
    })
  }

  requestSwap(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/request`, undefined, {
      signal: options.signal
    })
  }

  getOngoingChampionSwap(options: HttpApiRequestOptions = {}) {
    return this._http.get<OngoingChampionSwap>('/lol-champ-select/v1/ongoing-champion-swap', {
      signal: options.signal
    })
  }

  getPickableChampIds(options: HttpApiRequestOptions = {}) {
    return this._http.get<number[]>('/lol-champ-select/v1/pickable-champion-ids', {
      signal: options.signal
    })
  }

  getBannableChampIds(options: HttpApiRequestOptions = {}) {
    return this._http.get<number[]>('/lol-champ-select/v1/bannable-champion-ids', {
      signal: options.signal
    })
  }

  reroll(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-champ-select/v1/session/my-selection/reroll', undefined, {
      signal: options.signal
    })
  }

  getCurrentChamp(options: HttpApiRequestOptions = {}) {
    return this._http.get<number>('/lol-champ-select/v1/current-champion', {
      signal: options.signal
    })
  }

  getDisabledChampions(options: HttpApiRequestOptions = {}) {
    return this._http.get<number[]>('/lol-champ-select/v1/disabled-champion-ids', {
      signal: options.signal
    })
  }

  getSummoner(cellId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampSelectSummoner>(`/lol-champ-select/v1/summoners/${cellId}`, {
      signal: options.signal
    })
  }

  setSkin(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.patch(
      '/lol-champ-select/v1/session/my-selection',
      {
        selectedSkinId: id
      },
      { signal: options.signal }
    )
  }

  getCarouselSkins(options: HttpApiRequestOptions = {}) {
    return this._http.get<CarouselSkins[]>('/lol-champ-select/v1/skin-carousel-skins', {
      signal: options.signal
    })
  }

  getMySelections(options: HttpApiRequestOptions = {}) {
    return this._http.get<MySelection>('/lol-champ-select/v1/session/my-selection', {
      signal: options.signal
    })
  }

  setSummonerSpells(
    data: { spell1Id?: number; spell2Id?: number },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.patch<void>('/lol-champ-select/v1/session/my-selection', data, {
      signal: options.signal
    })
  }

  getSkinSelectorInfo(options: HttpApiRequestOptions = {}) {
    return this._http.get<SkinSelectorInfo>('/lol-champ-select/v1/skin-selector-info', {
      signal: options.signal
    })
  }
}
