import {
  parseQq101AramChampions,
  parseQq101Build,
  parseQq101ClassicLanes,
  parseQq101ClassicTierList,
  parseQq101Durations,
  parseQq101JungleRoutes,
  parseQq101Matchups,
  parseQq101MayhemAugments,
  parseQq101MayhemChampions,
  parseQq101MayhemDetails,
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
} from '@shared/data-adapter/qq101/protocol'
import type {
  Qq101ClassicPosition,
  Qq101HttpApiAxiosHelper,
  Qq101PairQuery,
  Qq101RequestOptions,
  Qq101RiftQuery
} from '@shared/http-api-axios-helper/qq101'
import { QueueKeeper } from '@shared/utils/queue-keeper'

/** Compose the four source layers without adding conversion to the Axios helper. */
export class Qq101DataSource {
  private readonly _queue = new QueueKeeper([{ id: 'qq101', options: { concurrency: 4 } }])
  private _sequence = 0

  constructor(private readonly _http: Qq101HttpApiAxiosHelper) {}

  async getPatches(options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getPatches(options),
      { signal: options.signal }
    )
    return parseQq101Patches(response.data).data
  }

  async getClassicLanes(options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getClassicLanes(options),
      { signal: options.signal }
    )
    return parseQq101ClassicLanes(response.data).data
  }

  async getJungleRoutes(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getJungleRoutes(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101JungleRoutes(response.data, championId).data
  }

  async getMayhemDetails(championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getMayhemDetails(championId, options),
      { signal: options.signal }
    )
    return parseQq101MayhemDetails(response.data, championId).data
  }

  async getTierList(query: Qq101RiftQuery, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getTierList(query, options),
      { signal: options.signal }
    )
    return parseQq101TierList(response.data, query.patch).data
  }

  async getClassicTierList(position: Qq101ClassicPosition, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getClassicTierList(position, options),
      { signal: options.signal }
    )
    return parseQq101ClassicTierList(response.data, position).data
  }

  async getTrend(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getTrend(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Trend(response.data, championId).data
  }

  async getMatchups(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getMatchups(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Matchups(response.data, championId).data
  }

  async getSynergies(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getSynergies(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Synergies(response.data, championId).data
  }

  async getSummonerSpells(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getSummonerSpells(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101SummonerSpells(response.data, championId).data
  }

  async getSkillOrder(
    query: Qq101RiftQuery,
    championId: number,
    options: Qq101RequestOptions = {}
  ) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getSkillOrder(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101SkillOrder(response.data, championId).data
  }

  async getTierStats(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getTierStats(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101TierStats(response.data, championId).data
  }

  async getBuild(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getBuild(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Build(response.data, championId).data
  }

  async getRunes(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getRunes(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Runes(response.data, championId).data
  }

  async getPositions(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getPositions(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Positions(response.data, championId).data
  }

  async getDurations(query: Qq101RiftQuery, championId: number, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getDurations(query, championId, options),
      { signal: options.signal }
    )
    return parseQq101Durations(response.data, championId).data
  }

  async getMayhemChampions(date: string, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getMayhemChampions(date, options),
      { signal: options.signal }
    )
    return parseQq101MayhemChampions(response.data, date).data
  }

  async getAramChampions(date: string, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getAramChampions(date, options),
      { signal: options.signal }
    )
    return parseQq101AramChampions(response.data, date).data
  }

  async getMayhemAugments(options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getMayhemAugments(options),
      { signal: options.signal }
    )
    return parseQq101MayhemAugments(response.data).data
  }

  async getMayhemPairSynergies(query: Qq101PairQuery, options: Qq101RequestOptions = {}) {
    const response = await this._queue.add(
      'qq101',
      String(++this._sequence),
      () => this._http.getMayhemPairSynergies(query, options),
      { signal: options.signal }
    )
    return parseQq101MayhemPairSynergies(response.data).data
  }
}
