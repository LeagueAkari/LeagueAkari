import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class SummonerHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentSummoner(options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerInfo>('/lol-summoner/v1/current-summoner', {
      signal: options.signal
    })
  }

  getSummoner(id: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v1/summoners/${id}`, {
      signal: options.signal
    })
  }

  getSummonerByPuuid(puuid: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v2/summoners/puuid/${puuid}`, {
      signal: options.signal
    })
  }

  getSummonerByName(name: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v1/summoners?name=${name}`, {
      signal: options.signal
    })
  }

  checkAvailability(name: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<boolean>(
      `/lol-summoner/v1/check-name-availability-new-summoners/${name}`,
      { signal: options.signal }
    )
  }

  updateSummonerProfile(
    data: { inventory?: string; key: string; value: any },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post('/lol-summoner/v1/current-summoner/summoner-profile', data, {
      signal: options.signal
    })
  }

  updateSummonerName(name: string, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-summoner/v1/current-summoner/name', name, {
      signal: options.signal
    })
  }

  // 疑似不可用
  newSummonerName(name: string, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-summoner/v1/summoners', { name }, { signal: options.signal })
  }

  setSummonerBackgroundSkin(skinId: number, options: HttpApiRequestOptions = {}) {
    return this.updateSummonerProfile(
      {
        key: 'backgroundSkinId',
        value: skinId
      },
      options
    )
  }

  setSummonerBackgroundAugments(augmentId: string, options: HttpApiRequestOptions = {}) {
    return this.updateSummonerProfile(
      {
        key: 'backgroundSkinAugments',
        value: augmentId
      },
      options
    )
  }

  getSummonerAliases(
    nameTagList: { gameName: string; tagLine: string }[],
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post<SummonerInfo[]>('/lol-summoner/v1/summoners/aliases', nameTagList, {
      signal: options.signal
    })
  }

  async getSummonerAlias(name: string, tag: string, options: HttpApiRequestOptions = {}) {
    const response = await this.getSummonerAliases([{ gameName: name, tagLine: tag }], options)
    const result = response.data[0]
    return result || null
  }

  getCurrentSummonerProfile(options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerProfile>('/lol-summoner/v1/current-summoner/summoner-profile', {
      signal: options.signal
    })
  }

  getSummonerProfile(puuid: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerProfile>(`/lol-summoner/v1/summoner-profile`, {
      signal: options.signal,
      params: { puuid }
    })
  }

  // 新号命名
  saveAlias(gameName: string, tagLine?: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      '/lol-summoner/v1/save-alias',
      { gameName, tagLine },
      { signal: options.signal }
    )
  }

  putSummonerIcon(iconId: number, options: HttpApiRequestOptions = {}) {
    return this._http.put(
      '/lol-summoner/v1/current-summoner/icon',
      { profileIconId: iconId },
      { signal: options.signal }
    )
  }
}
