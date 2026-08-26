import {
  type ChampionDataDetails,
  type ChampionDataOverview,
  type ChampionDataPosition,
  type ChampionDataQuery,
  type ChampionDataSourceId,
  type Qq101MayhemInput,
  type Qq101RankedDetailsInput,
  adaptOpggChampionDetails,
  adaptOpggChampionOverview,
  adaptOpggMayhemDetails,
  adaptOpggMayhemOverview,
  adaptQq101ClassicOverview,
  adaptQq101MayhemDetails,
  adaptQq101MayhemOverview,
  adaptQq101RankedDetails,
  adaptQq101RankedOverview,
  toQq101ClassicPosition,
  toQq101Position,
  toQq101Tier
} from '@shared/data-adapter/champion-data'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import type { Qq101HttpApiAxiosHelper, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import type { PositionType, RegionType, TierType } from '@shared/types/opgg'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'

import type { AkariLogger } from '../logger-factory'
import type { ChampionDataLoadOptions, ChampionDataSourceLoader } from './context'

const UNIFIED_TO_OPGG_POSITION: Readonly<Record<ChampionDataPosition, PositionType>> = {
  all: 'all',
  top: 'top',
  jungle: 'jungle',
  middle: 'mid',
  bottom: 'adc',
  utility: 'support',
  none: 'none'
}

export class ChampionDataMainSourceLoader implements ChampionDataSourceLoader {
  constructor(
    private readonly _logger: AkariLogger,
    private readonly _opggApi: OpggHttpApiAxiosHelper,
    private readonly _qq101Api: Qq101HttpApiAxiosHelper
  ) {}

  private async _resolveOpggVersion(query: ChampionDataQuery, options: ChampionDataLoadOptions) {
    if (query.patch) return query.patch
    const response = await this._opggApi.getVersions(
      (query.region ?? 'global') as RegionType,
      query.mode,
      options
    )
    const version = response.data.data[0]
    if (!version) throw new Error(`OP.GG has no version for ${query.mode}`)
    return version
  }

  private async _resolveQq101RiftQuery(
    query: ChampionDataQuery,
    options: ChampionDataLoadOptions
  ): Promise<Qq101RiftQuery> {
    return {
      patch: query.patch ?? (await this._qq101Api.getLatestPatch(options)),
      tier: toQq101Tier(query.tier),
      position: toQq101Position(query.position)
    }
  }

  async loadPatches(
    source: ChampionDataSourceId,
    query: ChampionDataQuery,
    options: ChampionDataLoadOptions = {}
  ) {
    if (source === 'opgg') {
      if (query.mode === 'aram_mayhem') return []
      const response = await this._opggApi.getVersions(
        (query.region ?? 'global') as RegionType,
        query.mode,
        options
      )
      return response.data.data
    }

    if (query.mode === 'classic') return []
    const patches = await this._qq101Api.getPatches(options)
    return patches.map((patch) => patch.name)
  }

  async loadOverview(
    source: ChampionDataSourceId,
    query: ChampionDataQuery,
    options: ChampionDataLoadOptions = {}
  ) {
    return source === 'opgg'
      ? this._loadOpggOverview(query, options)
      : this._loadQq101Overview(query, options)
  }

  async loadDetails(
    source: ChampionDataSourceId,
    query: ChampionDataQuery,
    championId: number,
    options: ChampionDataLoadOptions = {}
  ) {
    return source === 'opgg'
      ? this._loadOpggDetails(query, championId, options)
      : this._loadQq101Details(query, championId, options)
  }

  private async _loadOpggOverview(
    query: ChampionDataQuery,
    options: ChampionDataLoadOptions
  ): Promise<ChampionDataOverview> {
    if (query.mode === 'aram_mayhem') {
      const response = await this._opggApi.getAramMayhemTiers(options)
      return adaptOpggMayhemOverview(response.data, { dataDate: null })
    }

    const region = (query.region ?? 'global') as RegionType
    const version = await this._resolveOpggVersion(query, options)
    const response = await this._opggApi.getChampions(region, query.mode, {
      tier: query.tier as TierType | undefined,
      version,
      signal: options.signal
    })
    return adaptOpggChampionOverview(response.data, {
      mode: query.mode,
      position: query.position
    })
  }

  private async _loadOpggDetails(
    query: ChampionDataQuery,
    championId: number,
    options: ChampionDataLoadOptions
  ): Promise<ChampionDataDetails | null> {
    if (query.mode === 'aram_mayhem') {
      const [tiers, augments] = await Promise.all([
        this._opggApi.getAramMayhemTiers(options),
        this._opggApi.getAramMayhemChampionAugments(championId, options)
      ])
      const tierItem = tiers.data.data.find((item) => item.champion_id === championId)
      return tierItem ? adaptOpggMayhemDetails(tierItem, augments.data, { dataDate: null }) : null
    }

    const region = (query.region ?? 'global') as RegionType
    const version = await this._resolveOpggVersion(query, options)
    const position = UNIFIED_TO_OPGG_POSITION[query.position ?? 'none']
    const response = await this._opggApi.getChampion(region, query.mode, championId, position, {
      tier: query.tier as TierType | undefined,
      version,
      signal: options.signal
    })
    return adaptOpggChampionDetails(response.data, {
      mode: query.mode,
      position: query.position
    })
  }

  private async _loadQq101Overview(
    query: ChampionDataQuery,
    options: ChampionDataLoadOptions
  ): Promise<ChampionDataOverview> {
    if (query.mode === 'classic') {
      const position = toQq101ClassicPosition(query.position)
      const result = await this._qq101Api.getClassicTierList(position, options)
      return adaptQq101ClassicOverview(result)
    }

    if (query.mode === 'ranked') {
      const riftQuery = await this._resolveQq101RiftQuery(query, options)
      let result = await this._qq101Api.getTierList(riftQuery, options)
      if (result.champions.length === 0 && !query.patch) {
        const patches = await this._qq101Api.getPatches(options)
        if (patches[1])
          result = await this._qq101Api.getTierList(
            { ...riftQuery, patch: patches[1].name },
            options
          )
      }
      return adaptQq101RankedOverview(result)
    }

    const date = dayjs().subtract(1, 'day').format('YYYYMMDD')
    const [champions, augments, synergies] = await Promise.allSettled([
      this._qq101Api.getMayhemChampions(date, options),
      this._qq101Api.getMayhemAugments(date, options),
      this._qq101Api.getMayhemPairSynergies(255, options)
    ])
    if (champions.status === 'rejected') throw champions.reason
    this._logPartialFailure('QQ101 Mayhem augments', augments)
    this._logPartialFailure('QQ101 Mayhem synergies', synergies)
    const input: Qq101MayhemInput = {
      date: champions.value.date,
      champions: champions.value.champions,
      ...(augments.status === 'fulfilled' ? { augments: augments.value.augments } : {}),
      ...(synergies.status === 'fulfilled' ? { synergies: synergies.value.synergies } : {})
    }
    return adaptQq101MayhemOverview(input)
  }

  private async _loadQq101Details(
    query: ChampionDataQuery,
    championId: number,
    options: ChampionDataLoadOptions
  ): Promise<ChampionDataDetails | null> {
    if (query.mode === 'classic') return null

    if (query.mode === 'aram_mayhem') {
      const date = dayjs().subtract(1, 'day').format('YYYYMMDD')
      const [champions, augments] = await Promise.allSettled([
        this._qq101Api.getMayhemChampions(date, options),
        this._qq101Api.getMayhemAugments(date, options)
      ])
      if (champions.status === 'rejected') throw champions.reason
      this._logPartialFailure('QQ101 Mayhem augments', augments)
      return adaptQq101MayhemDetails(
        {
          date: champions.value.date,
          champions: champions.value.champions,
          ...(augments.status === 'fulfilled' ? { augments: augments.value.augments } : {})
        },
        championId
      )
    }

    const riftQuery = await this._resolveQq101RiftQuery(query, options)
    const overview = await this._qq101Api.getTierList(riftQuery, options)
    const champion = overview.champions.find((item) => item.championId === championId)
    if (!champion) return null

    const results = await Promise.allSettled([
      this._qq101Api.getMatchups(riftQuery, championId, options),
      this._qq101Api.getSynergies(riftQuery, championId, options),
      this._qq101Api.getSummonerSpells(riftQuery, championId, options),
      this._qq101Api.getSkillOrder(riftQuery, championId, options),
      this._qq101Api.getBuild(riftQuery, championId, options),
      this._qq101Api.getRunes(riftQuery, championId, options),
      this._qq101Api.getPositions(riftQuery, championId, options),
      this._qq101Api.getTrend(riftQuery, championId, options),
      this._qq101Api.getTierStats(riftQuery, championId, options),
      this._qq101Api.getDurations(riftQuery, championId, options)
    ] as const)
    const labels = [
      'matchups',
      'synergies',
      'summoner spells',
      'skill order',
      'build',
      'runes',
      'positions',
      'trend',
      'tier stats',
      'durations'
    ]
    results.forEach((result, index) => this._logPartialFailure(`QQ101 ${labels[index]}`, result))
    const value = <T>(index: number) =>
      results[index].status === 'fulfilled' ? (results[index].value as T) : undefined
    const matchups = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getMatchups']>>>(0)
    const synergies = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSynergies']>>>(1)
    const spells = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSummonerSpells']>>>(2)
    const skills = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSkillOrder']>>>(3)
    const build = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getBuild']>>>(4)
    const runes = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getRunes']>>>(5)
    const positions = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getPositions']>>>(6)
    const trend = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getTrend']>>>(7)
    const tiers = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getTierStats']>>>(8)
    const durations = value<Awaited<ReturnType<Qq101HttpApiAxiosHelper['getDurations']>>>(9)
    const input: Qq101RankedDetailsInput = {
      date: overview.date,
      patch: overview.patch,
      champion,
      ...(matchups
        ? { matchups: { favorable: matchups.favorable, unfavorable: matchups.unfavorable } }
        : {}),
      ...(synergies ? { synergies: synergies.synergies } : {}),
      ...(spells ? { summonerSpells: spells.recommendations } : {}),
      ...(skills ? { abilityBuild: skills } : {}),
      ...(build ? { itemBuild: build } : {}),
      ...(runes ? { runes } : {}),
      ...(positions ? { positions: positions.positions } : {}),
      ...(trend ? { trends: trend.points } : {}),
      ...(tiers ? { tiers: tiers.tiers } : {}),
      ...(durations ? { durations: durations.durations } : {})
    }
    return adaptQq101RankedDetails(input)
  }

  private _logPartialFailure(label: string, result: PromiseSettledResult<unknown>) {
    if (result.status === 'rejected') {
      this._logger.warn(`${label} failed; continuing with partial data`, formatError(result.reason))
    }
  }
}
