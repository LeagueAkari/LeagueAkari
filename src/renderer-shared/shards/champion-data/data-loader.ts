import type {
  ChampionDataDetails,
  ChampionDataLoadResult,
  ChampionDataOverview,
  ChampionDataQuery
} from '@shared/data-adapter/champion-data'

import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  type ChampionDataRendererContext,
  type ChampionDataRendererRequestOptions
} from './context'

let nextRequestId = 0

export class ChampionDataRendererLoader {
  constructor(private readonly _context: ChampionDataRendererContext) {}

  loadPatches(query: ChampionDataQuery, options?: ChampionDataRendererRequestOptions) {
    return this._load<string[]>('loadPatches', [query], options)
  }

  loadOverview(query: ChampionDataQuery, options?: ChampionDataRendererRequestOptions) {
    return this._load<ChampionDataOverview>('loadOverview', [query], options)
  }

  loadDetails(
    query: ChampionDataQuery,
    championId: number,
    options?: ChampionDataRendererRequestOptions
  ) {
    return this._load<ChampionDataDetails>('loadDetails', [query, championId], options)
  }

  private async _load<T>(
    method: 'loadPatches' | 'loadOverview' | 'loadDetails',
    args: unknown[],
    options: ChampionDataRendererRequestOptions = {}
  ): Promise<ChampionDataLoadResult<T>> {
    options.signal?.throwIfAborted()
    const requestId = `champion-data-${Date.now()}-${nextRequestId++}`
    const cancel = () => {
      void this._context.ipc
        .call(CHAMPION_DATA_MAIN_NAMESPACE, 'cancelRequest', requestId)
        .catch(() => undefined)
    }
    options.signal?.addEventListener('abort', cancel, { once: true })

    try {
      return await this._context.ipc.call<ChampionDataLoadResult<T>>(
        CHAMPION_DATA_MAIN_NAMESPACE,
        method,
        requestId,
        ...args
      )
    } finally {
      options.signal?.removeEventListener('abort', cancel)
    }
  }
}
