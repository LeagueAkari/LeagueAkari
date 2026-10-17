import { toQq101ClassicPosition, toQq101Position } from '@shared/data-adapter/qq101/protocol'
import type { Qq101DataSource } from '@shared/data-sources/qq101'
import type { Qq101PairQuery, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'

import type { LoggerRenderer } from '../../logger'
import type { Qq101ChampionDataOverview, Qq101RiftSectionKey, Qq101RiftSections } from './types'

export interface Qq101OverviewLoadResult {
  patches: string[]
  patch: string | null
  overview: Qq101ChampionDataOverview
}

export class Qq101ChampionDataLoader {
  constructor(
    private readonly _logger: LoggerRenderer,
    private readonly _api: Qq101DataSource
  ) {}

  loadPatches(signal: AbortSignal) {
    return this._api.getPatches({ signal })
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
    preferences: Qq101ChampionDataPreferences,
    signal: AbortSignal
  ): Promise<Qq101OverviewLoadResult> {
    if (preferences.mode === 'aram') {
      const data = await this._loadDatedChampions(
        (date) => this._api.getAramChampions(date, { signal }),
        signal
      )
      return { patches: [], patch: null, overview: { mode: 'aram', data } }
    }

    if (preferences.mode === 'classic') {
      const data = await this._api.getClassicTierList(
        toQq101ClassicPosition(preferences.position),
        { signal }
      )

      return { patches: [], patch: null, overview: { mode: 'classic', data } }
    }

    if (preferences.mode === 'aram_mayhem') {
      const [champions, augments, synergies] = await Promise.allSettled([
        this._loadDatedChampions((date) => this._api.getMayhemChampions(date, { signal }), signal),
        this._api.getMayhemAugments({ signal }),
        this._api.getMayhemPairSynergies(
          { championId: null, firstRole: 'all', secondRole: 'all' },
          { signal }
        )
      ])

      signal.throwIfAborted()
      this._logPartialFailure('QQ101 Mayhem champions', champions)
      this._logPartialFailure('QQ101 Mayhem augments', augments)
      this._logPartialFailure('QQ101 Mayhem synergies', synergies)

      return {
        patches: [],
        patch: null,
        overview: {
          mode: 'aram_mayhem',
          data: {
            date: champions.status === 'fulfilled' ? champions.value.date : '',
            augmentDate: augments.status === 'fulfilled' ? augments.value.date : null,
            synergyDate: synergies.status === 'fulfilled' ? synergies.value.date : null,
            champions: champions.status === 'fulfilled' ? champions.value.champions : [],
            augments: augments.status === 'fulfilled' ? augments.value.augments : null,
            synergies: synergies.status === 'fulfilled' ? synergies.value.synergies : null,
            errors: {
              ...(champions.status === 'rejected'
                ? { champions: formatError(champions.reason) }
                : {}),
              ...(augments.status === 'rejected' ? { augments: formatError(augments.reason) } : {}),
              ...(synergies.status === 'rejected'
                ? { synergies: formatError(synergies.reason) }
                : {})
            }
          }
        }
      }
    }

    const patches = await this._api.getPatches({ signal })
    const patchNames = patches.map((patch) => patch.name)
    const requestedPatch =
      (preferences.patch && patchNames.includes(preferences.patch) && preferences.patch) ||
      patchNames[0]

    if (!requestedPatch) {
      throw new Error('QQ101 patch list is empty')
    }

    let patch = requestedPatch
    let data = await this._api.getTierList(this._riftQuery(preferences, patch), { signal })

    if (data.champions.length === 0 && preferences.patch === null && patchNames[1]) {
      patch = patchNames[1]
      data = await this._api.getTierList(this._riftQuery(preferences, patch), { signal })
    }

    return { patches: patchNames, patch, overview: { mode: 'ranked', data } }
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
    for (let days = 1; ; days++) {
      signal.throwIfAborted()
      const date = this._dateBefore(days)
      const result = await load(date)
      signal.throwIfAborted()
      if (result.champions.length || days === 3) {
        return result
      }
    }
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
