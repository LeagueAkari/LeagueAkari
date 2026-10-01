import type { AxiosInstance } from 'axios'
import { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

export interface GtimgHeroListJs {
  hero: Hero[]
  version: string
  fileName: string
  fileTime: string
}

export interface GtimgClassicHero {
  heroId: number
  name: string
  title: string
  alias: string
  baseAlias: string
  roles: string[]
  portrait: string
}

export interface Hero {
  heroId: string
  name: string
  alias: string
  title: string
  roles: string[]
  isWeekFree: string
  attack: string
  defense: string
  magic: string
  difficulty: string
  selectAudio: string
  banAudio: string
  isARAMweekfree: string
  ispermanentweekfree: string
  changeLabel: string
  goldPrice: string
  couponPrice: string
  camp: string
  campId: string
  keywords: string
  instance_id: string
}

export interface GtimgKiwiAugments {
  augmentID: number
  name_en: string
  name_cn: string
  level: Level
  desc: string
  tooltip: string
  large_Icon: string
  small_Icon: string
}

export enum Level {
  KGold = 'kGold',
  KPrismatic = 'kPrismatic',
  KSilver = 'kSilver'
}

export class GtimgApi {
  static BASE_URL = 'https://game.gtimg.cn/'

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
    const { data } = await this._http.get<GtimgHeroListJs>(
      '/images/lol/act/img/js/heroList/hero_list.js',
      { signal }
    )
    return data
  }

  async getKiwiAugments(signal?: AbortSignal) {
    const { data } = await this._http.get<GtimgKiwiAugments[]>(
      'https://game.gtimg.cn/images/lol/act/img/js/kiwi/kiwi_augments.json',
      { signal }
    )
    return data
  }

  async getClassicHeroes(signal?: AbortSignal) {
    const { data } = await this._http.get<{ heroes: GtimgClassicHero[] }>(
      '/images/lol/act/img/jade/js/heroes_index.js',
      { signal }
    )
    if (!Array.isArray(data.heroes)) {
      throw new Error('Invalid QQ101 classic hero catalog')
    }
    return data.heroes
  }
}
