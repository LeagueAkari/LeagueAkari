import {
  type Qq101ClassicPosition,
  parseQq101Build,
  parseQq101ClassicTierList,
  parseQq101Durations,
  parseQq101Matchups,
  parseQq101MayhemAugments,
  parseQq101MayhemChampions,
  parseQq101MayhemPairSynergies,
  parseQq101Patches,
  parseQq101Positions,
  parseQq101Runes,
  parseQq101SkillOrder,
  parseQq101SummonerSpells,
  parseQq101Synergies,
  parseQq101TierList,
  parseQq101TierStats,
  parseQq101Trend
} from '@shared/data-adapter/champion-data/qq101-protocol'
import type { AxiosInstance } from 'axios'

export interface Qq101RiftQuery {
  patch: string
  tier: number
  position: string
}

export interface Qq101RequestOptions {
  signal?: AbortSignal
}

const RIFT_API_PATH = '/go/battle_info/odp_proxy/lol_101strategy'
const MAYHEM_API_PATH = '/go/battle_info/odp_proxy'
const CLASSIC_API_PATH = '/go/battle_info/odp_proxy/jade_hero_rank'

export class Qq101HttpApiAxiosHelper {
  static BASE_URL = 'https://mlol.qt.qq.com'

  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) this._http.defaults.baseURL = Qq101HttpApiAxiosHelper.BASE_URL
  }

  private async _get(
    path: string,
    params: Record<string, string | number>,
    options: Qq101RequestOptions
  ) {
    const response = await this._http.get<unknown>(path, { params, signal: options.signal })
    return response.data
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
    const data = await this._get('/go/database/versionlist', { zone: 'lol', from: 'h5' }, options)
    return parseQq101Patches(data)
  }

  async getLatestPatch(options: Qq101RequestOptions = {}) {
    const patches = await this.getPatches(options)
    if (!patches[0]) throw new Error('QQ101 patch list is empty')
    return patches[0].name
  }

  async getTierList(query: Qq101RiftQuery, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      RIFT_API_PATH,
      { ...this._riftParams(query), sort_metric: 1, sort_order: 2 },
      options
    )
    return parseQq101TierList(data, query.patch)
  }

  async getClassicTierList(position: Qq101ClassicPosition, options: Qq101RequestOptions = {}) {
    const data = await this._get(CLASSIC_API_PATH, { lane: position, itier: 255 }, options)
    return parseQq101ClassicTierList(data, position)
  }

  async getTrend(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_trend`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Trend(data, championId)
  }

  async getMatchups(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_confront`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Matchups(data, championId)
  }

  async getSynergies(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_partner`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Synergies(data, championId)
  }

  async getSummonerSpells(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    const data = await this._get(
      `${RIFT_API_PATH}_skill`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101SummonerSpells(data, championId)
  }

  async getSkillOrder(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    const data = await this._get(
      `${RIFT_API_PATH}_skill_point`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101SkillOrder(data, championId)
  }

  async getTierStats(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_segment`,
      { ...this._riftParams(query, championId), itier: 255 },
      options
    )
    return parseQq101TierStats(data, championId)
  }

  async getBuild(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_build`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Build(data, championId)
  }

  async getRunes(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_runeinfo`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Runes(data, championId)
  }

  async getPositions(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_newlane`,
      {
        itier: query.tier,
        version_id: query.patch,
        championid: championId
      },
      options
    )
    return parseQq101Positions(data, championId)
  }

  async getDurations(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${RIFT_API_PATH}_duration`,
      this._riftParams(query, championId),
      options
    )
    return parseQq101Durations(data, championId)
  }

  async getMayhemChampions(date: string, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${MAYHEM_API_PATH}/fuwen_aram_hero_rank_v2`,
      { dtstatdate: date },
      options
    )
    return parseQq101MayhemChampions(data, date)
  }

  async getMayhemAugments(date: string, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${MAYHEM_API_PATH}/fuwen_aram_rune_rank_v2`,
      { augmentid_level: 255 },
      options
    )
    return parseQq101MayhemAugments(data, date)
  }

  async getMayhemPairSynergies(championId = 255, options: Qq101RequestOptions = {}) {
    const data = await this._get(
      `${MAYHEM_API_PATH}/fuwen_aram_hero_parttner`,
      { role1: 255, role2: 255, championid: championId },
      options
    )
    return parseQq101MayhemPairSynergies(data)
  }
}
