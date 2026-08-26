import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  ChampionDataPreferences,
  ChampionDataQuery,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_RENDERER_NAMESPACE,
  type ChampionDataRendererContext,
  type ChampionDataRendererRequestOptions
} from './context'
import { ChampionDataRendererLoader } from './data-loader'
import { syncChampionDataState } from './state-sync'

@Shard(ChampionDataRenderer.id)
export class ChampionDataRenderer implements IAkariShardInitDispose {
  static id = CHAMPION_DATA_RENDERER_NAMESPACE

  private readonly _context: ChampionDataRendererContext
  private readonly _loader: ChampionDataRendererLoader

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {
    this._context = { ipc, piniaMobxUtils }
    this._loader = new ChampionDataRendererLoader(this._context)
  }

  loadPatches(query: ChampionDataQuery, options?: ChampionDataRendererRequestOptions) {
    return this._loader.loadPatches(query, options)
  }

  loadOverview(query: ChampionDataQuery, options?: ChampionDataRendererRequestOptions) {
    return this._loader.loadOverview(query, options)
  }

  loadDetails(
    query: ChampionDataQuery,
    championId: number,
    options?: ChampionDataRendererRequestOptions
  ) {
    return this._loader.loadDetails(query, championId, options)
  }

  setPreferredSource(source: ChampionDataSourceId) {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setPreferredSource', source)
  }

  setPreferences(preferences: Partial<ChampionDataPreferences>) {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setPreferences', preferences)
  }

  getCapabilities() {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'getCapabilities')
  }

  async onInit() {
    await syncChampionDataState(this._context)
  }
}
