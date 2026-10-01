import { toQq101ClassicPosition, toQq101Position } from '@shared/data-adapter/qq101/protocol'
import type { Qq101HttpApiAxiosHelper, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'

import type { LoggerRenderer } from '../../logger'
import type {
  Qq101ChampionDataDetails,
  Qq101ChampionDataOverview,
  Qq101RankedDetailsData
} from './types'

export interface Qq101OverviewLoadResult {
  patches: string[]
  patch: string | null
  overview: Qq101ChampionDataOverview
}

export class Qq101ChampionDataLoader {
  constructor(
    private readonly _logger: LoggerRenderer,
    private readonly _api: Qq101HttpApiAxiosHelper
  ) {}

  async loadOverview(
    preferences: Qq101ChampionDataPreferences,
    signal: AbortSignal
  ): Promise<Qq101OverviewLoadResult> {
    if (preferences.mode === 'aram') {
      const data = await this._loadDatedChampions('aram', signal)
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
        this._loadDatedChampions('aram_mayhem', signal),
        this._api.getMayhemAugments({ signal }),
        this._api.getMayhemPairSynergies(255, { signal })
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

  async loadDetails(
    preferences: Qq101ChampionDataPreferences,
    overview: Qq101ChampionDataOverview,
    championId: number,
    signal: AbortSignal
  ): Promise<Qq101ChampionDataDetails | null> {
    if (overview.mode === 'classic') {
      return null
    }

    if (overview.mode === 'aram') {
      const champion = overview.data.champions.find((item) => item.championId === championId)
      return champion ? { mode: 'aram', data: champion } : null
    }

    if (overview.mode === 'aram_mayhem') {
      const champion = overview.data.champions.find((item) => item.championId === championId)

      if (!champion) {
        return null
      }

      let augments = overview.data.augments

      if (!augments) {
        const result = await Promise.allSettled([this._api.getMayhemAugments({ signal })])

        this._logPartialFailure('QQ101 Mayhem augments', result[0])
        augments = result[0].status === 'fulfilled' ? result[0].value.augments : null
      }

      const [result] = await Promise.allSettled([
        this._api.getMayhemDetails(championId, { signal })
      ])
      signal.throwIfAborted()
      this._logPartialFailure('QQ101 Mayhem details', result)
      const recommendations = result.status === 'fulfilled' ? result.value : null
      const error = result.status === 'rejected' ? formatError(result.reason) : null
      return { mode: 'aram_mayhem', data: { champion, augments, recommendations, error } }
    }

    const patch = overview.data.patch
    const query = this._riftQuery(preferences, patch)
    const [positionsResult] = await Promise.allSettled([
      this._api.getPositions(query, championId, { signal })
    ])
    signal.throwIfAborted()
    if (query.position === 'ALL') {
      if (positionsResult.status === 'rejected') {
        throw positionsResult.reason
      }
      const positions = positionsResult.value
      const available = [...positions.positions].sort((a, b) => (b.share ?? 0) - (a.share ?? 0))
      if (!available.length) {
        return null
      }
      query.position = available[0].position
    }
    const champion =
      overview.data.champions.find(
        (item) => item.championId === championId && item.position === query.position
      ) ?? null
    const results = await Promise.allSettled([
      this._api.getMatchups(query, championId, { signal }),
      this._api.getSynergies(query, championId, { signal }),
      this._api.getSummonerSpells(query, championId, { signal }),
      this._api.getSkillOrder(query, championId, { signal }),
      this._api.getBuild(query, championId, { signal }),
      this._api.getRunes(query, championId, { signal }),
      positionsResult.status === 'fulfilled'
        ? Promise.resolve(positionsResult.value)
        : Promise.reject(positionsResult.reason),
      this._api.getTrend(query, championId, { signal }),
      this._api.getTierStats(query, championId, { signal }),
      this._api.getDurations(query, championId, { signal })
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

    signal.throwIfAborted()
    results.forEach((result, index) => this._logPartialFailure(`QQ101 ${labels[index]}`, result))

    const value = <T>(index: number) =>
      results[index].status === 'fulfilled' ? (results[index].value as T) : null
    const data: Qq101RankedDetailsData = {
      championId,
      position: query.position,
      errors: Object.fromEntries(
        results.flatMap((result, index) =>
          result.status === 'rejected' ? [[labels[index], formatError(result.reason)]] : []
        )
      ),
      champion,
      matchups: value(0),
      synergies: value(1),
      summonerSpells: value(2),
      skillOrder: value(3),
      build: value(4),
      runes: value(5),
      positions: value(6),
      trend: value(7),
      tierStats: value(8),
      durations: value(9)
    }

    return { mode: 'ranked', data }
  }

  private _dateBefore(days: number) {
    // QQ101 daily snapshots use China's calendar day, independent of OS timezone.
    return new Date(Date.now() + 8 * 60 * 60 * 1000 - days * 86400000)
      .toISOString()
      .slice(0, 10)
      .replaceAll('-', '')
  }

  private async _loadDatedChampions(mode: 'aram' | 'aram_mayhem', signal: AbortSignal) {
    for (let days = 1; ; days++) {
      signal.throwIfAborted()
      const date = this._dateBefore(days)
      const result =
        mode === 'aram'
          ? await this._api.getAramChampions(date, { signal })
          : await this._api.getMayhemChampions(date, { signal })
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
