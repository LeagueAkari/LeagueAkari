import {
  type ChampionDataFallbackReason,
  type ChampionDataLoadAttempt,
  type ChampionDataLoadResult,
  type ChampionDataQuery,
  type ChampionDataSourceId,
  getChampionDataCapability
} from '@shared/data-adapter/champion-data'
import { formatError } from '@shared/utils/errors'

import type { ChampionDataMainContext, ChampionDataSourceLoader } from './context'
import type { ChampionDataLoadOptions } from './context'

export class ChampionDataServiceController {
  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _sourceLoader: ChampionDataSourceLoader
  ) {}

  loadPatches(query: ChampionDataQuery, options: ChampionDataLoadOptions = {}) {
    return this._load(
      query,
      (source) => this._sourceLoader.loadPatches(source, query, options),
      options
    )
  }

  loadOverview(query: ChampionDataQuery, options: ChampionDataLoadOptions = {}) {
    return this._load(
      query,
      (source) => this._sourceLoader.loadOverview(source, query, options),
      options
    )
  }

  loadDetails(query: ChampionDataQuery, championId: number, options: ChampionDataLoadOptions = {}) {
    return this._load(
      query,
      async (source) => {
        const details = await this._sourceLoader.loadDetails(source, query, championId, options)
        if (!details) throw new Error(`Champion ${championId} is not available`)
        return details
      },
      options
    )
  }

  private async _load<T>(
    query: ChampionDataQuery,
    load: (source: ChampionDataSourceId) => Promise<T>,
    options: ChampionDataLoadOptions
  ): Promise<ChampionDataLoadResult<T>> {
    const { logger, settings, state } = this._context
    const preferredSource = query.source ?? settings.preferredSource
    const attempts: ChampionDataLoadAttempt[] = []

    // A different provider is a different dataset, not a retry target. Region scope and even
    // same-named mode statistics can have different meanings, so only retry inside the source
    // loader/HTTP client. Cross-source substitution requires an explicit future compatibility rule.
    options.signal?.throwIfAborted()
    if (!state.availability.sources[preferredSource].enabled) {
      attempts.push({ source: preferredSource, outcome: 'disabled', message: null })
    } else if (!getChampionDataCapability(preferredSource, query.mode)) {
      attempts.push({ source: preferredSource, outcome: 'mode-unsupported', message: null })
    } else {
      try {
        const data = await load(preferredSource)
        attempts.push({ source: preferredSource, outcome: 'success', message: null })
        state.setLastResolution(preferredSource, null)
        return {
          status: 'success',
          data,
          preferredSource,
          effectiveSource: preferredSource,
          fallbackReason: null,
          attempts
        }
      } catch (error) {
        options.signal?.throwIfAborted()
        const message = formatError(error)
        attempts.push({ source: preferredSource, outcome: 'failed', message })
        logger.warn(`Champion data request failed for ${preferredSource}`, message)
      }
    }

    const fallbackReason = this._unavailableReason(attempts[0])
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

  private _unavailableReason(
    attempt: ChampionDataLoadAttempt | undefined
  ): ChampionDataFallbackReason {
    if (attempt?.outcome === 'disabled') return 'source-disabled'
    if (attempt?.outcome === 'mode-unsupported') return 'mode-unsupported'
    return 'request-failed'
  }
}
