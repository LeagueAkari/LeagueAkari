import {
  type ChampionDataDetails,
  type ChampionDataFallbackReason,
  type ChampionDataLoadAttempt,
  type ChampionDataLoadResult,
  type ChampionDataOverview,
  type ChampionDataQuery,
  type ChampionDataSourceId,
  getChampionDataCapability
} from '@shared/data-adapter/champion-data'
import { formatError } from '@shared/utils/errors'

import type { ChampionDataMainContext, ChampionDataSourceLoader } from './context'

export class ChampionDataServiceController {
  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _sourceLoader: ChampionDataSourceLoader
  ) {}

  loadOverview(query: ChampionDataQuery) {
    return this._load(query, (source) => this._sourceLoader.loadOverview(source, query))
  }

  loadDetails(query: ChampionDataQuery, championId: number) {
    return this._load(query, async (source) => {
      const details = await this._sourceLoader.loadDetails(source, query, championId)
      if (!details) throw new Error(`Champion ${championId} is not available`)
      return details
    })
  }

  private async _load<T extends ChampionDataOverview | ChampionDataDetails>(
    query: ChampionDataQuery,
    load: (source: ChampionDataSourceId) => Promise<T>
  ): Promise<ChampionDataLoadResult<T>> {
    const { logger, settings, state } = this._context
    const preferredSource = query.source ?? settings.preferredSource
    const fallbackSource: ChampionDataSourceId = preferredSource === 'opgg' ? 'qq101' : 'opgg'
    const attempts: ChampionDataLoadAttempt[] = []

    for (const source of [preferredSource, fallbackSource]) {
      if (!state.availability.sources[source].enabled) {
        attempts.push({ source, outcome: 'disabled', message: null })
        continue
      }
      if (!getChampionDataCapability(source, query.mode)) {
        attempts.push({ source, outcome: 'mode-unsupported', message: null })
        continue
      }

      try {
        const data = await load(source)
        attempts.push({ source, outcome: 'success', message: null })
        const fallbackReason = source === preferredSource ? null : this._fallbackReason(attempts[0])
        state.setLastResolution(source, fallbackReason)
        return {
          status: 'success',
          data,
          preferredSource,
          effectiveSource: source,
          fallbackReason,
          attempts
        }
      } catch (error) {
        const message = formatError(error)
        attempts.push({ source, outcome: 'failed', message })
        logger.warn(`Champion data request failed for ${source}`, message)
      }
    }

    const fallbackReason = this._fallbackReason(attempts[0])
    state.setLastResolution(null, fallbackReason)
    return {
      status: 'unavailable',
      data: null,
      preferredSource,
      effectiveSource: null,
      fallbackReason,
      attempts
    }
  }

  private _fallbackReason(
    attempt: ChampionDataLoadAttempt | undefined
  ): ChampionDataFallbackReason {
    if (attempt?.outcome === 'disabled') return 'source-disabled'
    if (attempt?.outcome === 'mode-unsupported') return 'mode-unsupported'
    return 'request-failed'
  }
}
