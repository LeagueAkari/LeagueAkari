import { Config, Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Qq101DataSource } from '@shared/data-sources/qq101'
import type { ChampionDataSourcePreferences } from '@shared/types/champion-data'

import { AkariProtocolRenderer } from '../akari-protocol'
import { useExtraAssetsStore } from '../extra-assets/store'
import { AkariIpcRenderer } from '../ipc'
import { LeagueClientRenderer } from '../league-client'
import { useLeagueClientStore } from '../league-client/store'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_RENDERER_NAMESPACE,
  type ChampionDataRendererConfig,
  type ChampionDataRendererContext
} from './context'
import { createChampionDataApis } from './http-api'
import { OpggChampionDataController } from './opgg/data-controller'
import { OpggChampionDataLoader } from './opgg/data-loader'
import { Qq101ChampionDataController } from './qq101/data-controller'
import { Qq101ChampionDataLoader } from './qq101/data-loader'
import { syncChampionDataResources, syncChampionDataState } from './state-sync'
import { useChampionDataStore } from './store'

@Shard(ChampionDataRenderer.id)
export class ChampionDataRenderer implements IAkariShardInitDispose {
  static id = CHAMPION_DATA_RENDERER_NAMESPACE

  public readonly api: ReturnType<typeof createChampionDataApis>
  public readonly opgg: OpggChampionDataController
  public readonly qq101: Qq101ChampionDataController
  private readonly _context: ChampionDataRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(AkariProtocolRenderer) protocol: AkariProtocolRenderer,
    @Dep(LoggerRenderer) logger: LoggerRenderer,
    @Dep(LeagueClientRenderer) leagueClient: LeagueClientRenderer,
    @Config() private readonly _config?: ChampionDataRendererConfig
  ) {
    this._context = { ipc, piniaMobxUtils, logger }
    this.api = createChampionDataApis(protocol)
    this.opgg = new OpggChampionDataController(
      {
        ...this._context,
        get state() {
          return useChampionDataStore().opgg
        },

        get settings() {
          return useChampionDataStore().settings
        },

        get leagueClient() {
          return useLeagueClientStore()
        },

        get extraAssets() {
          return useExtraAssetsStore()
        },

        get client() {
          return leagueClient
        }
      },
      new OpggChampionDataLoader(this.api.opgg)
    )
    this.qq101 = new Qq101ChampionDataController(
      this._context,
      new Qq101ChampionDataLoader(logger, new Qq101DataSource(this.api.qq101))
    )
  }

  async onInit() {
    await syncChampionDataResources(this._context)

    if (this._config?.enableFullData) {
      await syncChampionDataState(this._context)
      this.opgg.start()
      this.qq101.start()
    }
  }

  async onDispose() {
    this.opgg.dispose()
    this.qq101.dispose()
  }

  setSourcePreferences(preferences: ChampionDataSourcePreferences): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setSourcePreferences', preferences)
  }
}
