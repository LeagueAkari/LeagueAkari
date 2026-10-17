import type { AxiosInstance } from 'axios'

export type Qq101ClassicPosition = 'all' | 'top' | 'jungle' | 'middle' | 'bottom' | 'support'

export interface Qq101RiftQuery {
  patch: string
  tier: number
  position: string
}

export interface Qq101RequestOptions {
  signal?: AbortSignal
}

export type Qq101Role = 'all' | 'tank' | 'fighter' | 'assassin' | 'mage' | 'marksman' | 'support'

export interface Qq101PairQuery {
  championId: number | null
  firstRole: Qq101Role
  secondRole: Qq101Role
}

const RIFT_API_PATH = '/go/battle_info/odp_proxy/lol_101strategy'
const MAYHEM_API_PATH = '/go/battle_info/odp_proxy'
const CLASSIC_API_PATH = '/go/battle_info/odp_proxy/jade_hero_rank'

export class Qq101HttpApiAxiosHelper {
  static BASE_URL = 'https://mlol.qt.qq.com'

  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      this._http.defaults.baseURL = Qq101HttpApiAxiosHelper.BASE_URL
    }
  }

  private async _get(
    path: string,
    params: Record<string, string | number>,
    options: Qq101RequestOptions
  ) {
    return this._http.get<unknown>(path, { params, signal: options.signal })
  }

  private _riftParams(query: Qq101RiftQuery, championId?: number) {
    return {
      itier: query.tier,
      version_id: query.patch,
      lane: query.position,
      ...(championId === undefined ? {} : { championid: championId })
    }
  }

  async getPatches(options: Qq101RequestOptions = {}) {
    return this._get('/go/database/versionlist', { zone: 'lol', from: 'h5' }, options)
  }

  async getClassicLanes(options: Qq101RequestOptions = {}) {
    return this._get(`${MAYHEM_API_PATH}/jade_hero_lane`, { itype: 255 }, options)
  }

  async getJungleRoutes(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    return this._get(
      `${RIFT_API_PATH}_jungle`,
      {
        itier: query.tier,
        version_id: query.patch,
        championid: championId
      },
      options
    )
  }

  async getMayhemDetails(championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${MAYHEM_API_PATH}/fuwen_hero_rank`, { championid: championId }, options)
  }

  async getTierList(query: Qq101RiftQuery, options: Qq101RequestOptions = {}) {
    return this._get(
      RIFT_API_PATH,
      { ...this._riftParams(query), sort_metric: 1, sort_order: 2 },
      options
    )
  }

  async getClassicTierList(position: Qq101ClassicPosition, options: Qq101RequestOptions = {}) {
    return this._get(CLASSIC_API_PATH, { lane: position, itier: 255 }, options)
  }

  async getTrend(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_trend`, this._riftParams(query, championId), options)
  }

  async getMatchups(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_confront`, this._riftParams(query, championId), options)
  }

  async getSynergies(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_partner`, this._riftParams(query, championId), options)
  }

  async getSummonerSpells(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    return this._get(`${RIFT_API_PATH}_skill`, this._riftParams(query, championId), options)
  }

  async getSkillOrder(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    return this._get(`${RIFT_API_PATH}_skill_point`, this._riftParams(query, championId), options)
  }

  async getTierStats(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(
      `${RIFT_API_PATH}_segment`,
      { ...this._riftParams(query, championId), itier: 255 },
      options
    )
  }

  async getBuild(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_build`, this._riftParams(query, championId), options)
  }

  async getRunes(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_runeinfo`, this._riftParams(query, championId), options)
  }

  async getPositions(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(
      `${RIFT_API_PATH}_newlane`,
      {
        itier: query.tier,
        version_id: query.patch,
        championid: championId
      },
      options
    )
  }

  async getDurations(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    return this._get(`${RIFT_API_PATH}_duration`, this._riftParams(query, championId), options)
  }

  async getMayhemChampions(date: string, options: Qq101RequestOptions = {}) {
    return this._get(`${MAYHEM_API_PATH}/fuwen_aram_hero_rank_v2`, { dtstatdate: date }, options)
  }

  async getAramChampions(date: string, options: Qq101RequestOptions = {}) {
    return this._get(`${MAYHEM_API_PATH}/aram_hero_overview`, { dtstatdate: date }, options)
  }

  async getMayhemAugments(options: Qq101RequestOptions = {}) {
    return this._get(
      `${MAYHEM_API_PATH}/fuwen_aram_rune_rank_v2`,
      { augmentid_level: 255 },
      options
    )
  }

  async getMayhemPairSynergies(query: Qq101PairQuery, options: Qq101RequestOptions = {}) {
    const params = {
      role1: query.firstRole === 'all' ? 255 : query.firstRole,
      role2: query.secondRole === 'all' ? 255 : query.secondRole,
      championid: query.championId ?? 255
    }
    return this._get(`${MAYHEM_API_PATH}/fuwen_aram_hero_parttner`, params, options)
  }
}
