import type { AxiosInstance } from 'axios'
import { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

export * from './types'

export class GtimgApi {
  static BASE_URL = 'https://game.gtimg.cn/'

  getGuideCatalog(kind: 'items' | 'perks' | 'spells', signal?: AbortSignal) {
    const paths = {
      items: 'items/items',
      perks: 'runeList/rune_list2',
      spells: 'summonerskillList/summonerskill_list'
    }
    return this._http.get<unknown>(`/images/lol/act/img/js/${paths[kind]}.js`, { signal })
  }

  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

  get http() {
    return this._http
  }

  constructor(private readonly _http: AxiosInstance) {
    axiosRetry(this._http, {
      retries: 2
    })
  }

  async getHeroList(signal?: AbortSignal) {
    const { data } = await this._http.get<unknown>('/images/lol/act/img/js/heroList/hero_list.js', {
      signal
    })
    return data
  }

  async getKiwiAugments(signal?: AbortSignal) {
    const { data } = await this._http.get<unknown>(
      'https://game.gtimg.cn/images/lol/act/img/js/kiwi/kiwi_augments.json',
      { signal }
    )
    return data
  }

  async getClassicHeroes(signal?: AbortSignal) {
    const { data } = await this._http.get<unknown>('/images/lol/act/img/jade/js/heroes_index.js', {
      signal
    })
    return data
  }
}
