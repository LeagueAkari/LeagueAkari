import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { toQq101ClassicPosition, toQq101Position } from '@shared/data-adapter/qq101/protocol'
import type { Qq101DataSource } from '@shared/data-sources/qq101'
import type { Qq101PairQuery, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'

import type {
  Qq101ChampionDataOverview,
  Qq101OverviewQuery,
  Qq101RiftSectionKey,
  Qq101RiftSections
} from './types'

export class Qq101ChampionDataLoader {
  constructor(
    private readonly _logger: LoggerRenderer,
    private readonly _api: Qq101DataSource
  ) {}

  loadPatches(signal: AbortSignal) {
    return this._api.getPatches({ signal })
  }

  async resolveQuery(
    preferences: Qq101ChampionDataPreferences,
    signal: AbortSignal
  ): Promise<{ query: Qq101OverviewQuery; patches: string[] }> {
    if (preferences.mode !== 'ranked') {
      return { query: { ...preferences, mode: preferences.mode, patch: null }, patches: [] }
    }

    const patches = (await this.loadPatches(signal)).map((patch) => patch.name)
    signal.throwIfAborted()

    const patch =
      preferences.patch !== null && patches.includes(preferences.patch)
        ? preferences.patch
        : patches[0]

    if (!patch) {
      throw new Error('QQ101 patch list is empty')
    }

    return { query: { ...preferences, mode: 'ranked', patch }, patches }
  }

  loadPairs(query: Qq101PairQuery, signal: AbortSignal) {
    return this._api.getMayhemPairSynergies(query, { signal })
  }

  loadClassicLanes(signal: AbortSignal) {
    return this._api.getClassicLanes({ signal })
  }

  loadMayhemDetails(championId: number, signal: AbortSignal) {
    return this._api.getMayhemDetails(championId, { signal })
  }

  async loadMayhemSummary(championId: number, signal: AbortSignal) {
    const data = await this._loadDatedChampions(
      (date) => this._api.getMayhemChampions(date, { signal }),
      signal
    )
    return { ...data, champions: data.champions.filter((row) => row.championId === championId) }
  }

  loadRiftSection<K extends Qq101RiftSectionKey>(
    key: K,
    query: Qq101RiftQuery,
    championId: number,
    signal: AbortSignal
  ): Promise<Qq101RiftSections[K]> {
    const options = { signal }
    const requests: { [P in Qq101RiftSectionKey]: () => Promise<Qq101RiftSections[P]> } = {
      positions: () => this._api.getPositions(query, championId, options),
      matchups: () => this._api.getMatchups(query, championId, options),
      synergies: () => this._api.getSynergies(query, championId, options),
      summonerSpells: () => this._api.getSummonerSpells(query, championId, options),
      skillOrder: () => this._api.getSkillOrder(query, championId, options),
      build: () => this._api.getBuild(query, championId, options),
      runes: () => this._api.getRunes(query, championId, options),
      trend: () => this._api.getTrend(query, championId, options),
      tierStats: () => this._api.getTierStats(query, championId, options),
      durations: () => this._api.getDurations(query, championId, options),
      jungle: () => this._api.getJungleRoutes(query, championId, options)
    }

    return requests[key]()
  }

  async loadOverview(
    query: Qq101OverviewQuery,
    signal: AbortSignal
  ): Promise<Qq101ChampionDataOverview> {
    if (query.mode === 'ranked') {
      const data = await this._api.getTierList(this._riftQuery(query, query.patch), { signal })

      return { mode: 'ranked', data }
    }

    if (query.mode === 'aram') {
      const data = await this._loadDatedChampions(
        (date) => this._api.getAramChampions(date, { signal }),
        signal
      )
      return { mode: 'aram', data }
    }

    if (query.mode === 'classic') {
      const data = await this._api.getClassicTierList(toQq101ClassicPosition(query.position), {
        signal
      })

      return { mode: 'classic', data }
    }

    const [champions, augments] = await Promise.allSettled([
      this._loadDatedChampions((date) => this._api.getMayhemChampions(date, { signal }), signal),
      this._api.getMayhemAugments({ signal })
    ])

    signal.throwIfAborted()
    this._logPartialFailure('QQ101 Mayhem champions', champions)
    this._logPartialFailure('QQ101 Mayhem augments', augments)

    return {
      mode: 'aram_mayhem',
      data: {
        date: champions.status === 'fulfilled' ? champions.value.date : '',
        augmentDate: augments.status === 'fulfilled' ? augments.value.date : null,
        champions: champions.status === 'fulfilled' ? champions.value.champions : [],
        augments: augments.status === 'fulfilled' ? augments.value.augments : null,
        errors: {
          ...(champions.status === 'rejected' ? { champions: formatError(champions.reason) } : {}),
          ...(augments.status === 'rejected' ? { augments: formatError(augments.reason) } : {})
        }
      }
    }
  }

  private _dateBefore(days: number) {
    // QQ101 daily snapshots use China's calendar day, independent of OS timezone.
    return new Date(Date.now() + 8 * 60 * 60 * 1000 - days * 86400000)
      .toISOString()
      .slice(0, 10)
      .replaceAll('-', '')
  }

  private async _loadDatedChampions<T extends { champions: unknown[] }>(
    load: (date: string) => Promise<T>,
    signal: AbortSignal
  ) {
    signal.throwIfAborted()

    const data = await load(this._dateBefore(1))
    signal.throwIfAborted()

    return data
  }

  private _riftQuery(preferences: Qq101ChampionDataPreferences, patch: string): Qq101RiftQuery {
    return {
      patch,
      tier: preferences.tier,
      position: toQq101Position(preferences.position)
    }
  }

  private _logPartialFailure(label: string, result: PromiseSettledResult<unknown>) {
    if (result.status === 'rejected') {
      this._logger.warn(`${label} failed; continuing with partial data`, formatError(result.reason))
    }
  }
}
