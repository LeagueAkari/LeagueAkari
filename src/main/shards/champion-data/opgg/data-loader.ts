import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import type { OpggChampionDataQuery } from '@shared/types/champion-data/opgg'
import type { OpggRankedPosition } from '@shared/types/opgg'

import type {
  OpggLoadedChampion,
  OpggLoadedOverview,
  OpggOverviewTarget,
  OpggResolvedTarget
} from '../context'

export class OpggChampionDataLoader {
  private readonly _versions = new Map<string, { versions: string[]; expiresAt: number }>()

  constructor(private readonly _api: OpggHttpApiAxiosHelper) {}

  async resolveTarget(
    query: OpggChampionDataQuery,
    signal: AbortSignal,
    force: boolean
  ): Promise<OpggResolvedTarget> {
    if (query.mode === 'aram_mayhem') {
      return {
        target: { mode: 'aram_mayhem' },
        versions: [],
        requestedVersion: null
      }
    }

    const key = `${query.region}:${query.mode}`
    let cached = this._versions.get(key)

    if (force || !cached || cached.expiresAt <= Date.now()) {
      const response = await this._api.getChampionVersions(query.region, query.mode, { signal })
      signal.throwIfAborted()

      const versions = response.data.data

      if (versions.length === 0) {
        throw new Error(`OP.GG has no version for ${query.mode}`)
      }

      cached = { versions, expiresAt: Date.now() + 10 * 60_000 }
      this._versions.set(key, cached)
    }

    let requestedVersion: string | null = null
    let version = cached.versions[0]

    if (query.version !== null && cached.versions.includes(query.version)) {
      requestedVersion = query.version
      version = query.version
    }

    if (query.mode === 'arena') {
      return {
        target: { mode: 'arena', region: query.region, version },
        versions: cached.versions,
        requestedVersion
      }
    }

    return {
      target: { mode: query.mode, region: query.region, tier: query.tier, version },
      versions: cached.versions,
      requestedVersion
    }
  }

  clear() {
    this._versions.clear()
  }

  async loadOverview(target: OpggOverviewTarget, signal: AbortSignal): Promise<OpggLoadedOverview> {
    switch (target.mode) {
      case 'aram_mayhem': {
        const response = await this._api.getAramMayhemTiers({ signal })

        return { ...target, response: response.data }
      }

      case 'arena': {
        const response = await this._api.getArenaChampions(target.region, {
          version: target.version,
          signal
        })

        return { ...target, response: response.data }
      }

      case 'ranked': {
        const response = await this._api.getRankedChampions(target.region, {
          tier: target.tier,
          version: target.version,
          signal
        })

        return { ...target, mode: 'ranked', response: response.data }
      }

      case 'aram': {
        const response = await this._api.getAramChampions(target.region, {
          tier: target.tier,
          version: target.version,
          signal
        })

        return { ...target, mode: 'aram', response: response.data }
      }

      case 'nexus_blitz': {
        const response = await this._api.getNexusBlitzChampions(target.region, {
          tier: target.tier,
          version: target.version,
          signal
        })

        return { ...target, mode: 'nexus_blitz', response: response.data }
      }

      case 'urf': {
        const response = await this._api.getUrfChampions(target.region, {
          tier: target.tier,
          version: target.version,
          signal
        })

        return { ...target, mode: 'urf', response: response.data }
      }
    }
  }

  async loadChampion(
    overview: OpggLoadedOverview,
    championId: number,
    position: OpggRankedPosition,
    signal: AbortSignal
  ): Promise<OpggLoadedChampion | null> {
    if (overview.mode === 'aram_mayhem') {
      const summary = overview.response.data.find((item) => item.champion_id === championId)

      if (!summary) {
        return null
      }

      const response = await this._api.getAramMayhemChampionAugments(championId, { signal })

      return { mode: 'aram_mayhem', summary, response: response.data }
    }

    if (!overview.response.data.some((item) => item.id === championId)) {
      return null
    }

    switch (overview.mode) {
      case 'ranked': {
        const response = await this._api.getRankedChampion(overview.region, championId, position, {
          tier: overview.tier,
          version: overview.version,
          signal
        })

        return { mode: 'ranked', response: response.data }
      }

      case 'aram': {
        const response = await this._api.getAramChampion(overview.region, championId, {
          tier: overview.tier,
          version: overview.version,
          signal
        })

        return { mode: 'aram', response: response.data }
      }

      case 'arena': {
        const response = await this._api.getArenaChampion(overview.region, championId, {
          version: overview.version,
          signal
        })

        return { mode: 'arena', response: response.data }
      }

      case 'nexus_blitz': {
        const response = await this._api.getNexusBlitzChampion(overview.region, championId, {
          tier: overview.tier,
          version: overview.version,
          signal
        })

        return { mode: 'nexus_blitz', response: response.data }
      }

      case 'urf': {
        const response = await this._api.getUrfChampion(overview.region, championId, {
          tier: overview.tier,
          version: overview.version,
          signal
        })

        return { mode: 'urf', response: response.data }
      }
    }
  }
}
