import { Config, Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariProtocolRenderer } from '../akari-protocol'
import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  CHAMPION_DATA_RENDERER_NAMESPACE,
  type ChampionDataRendererConfig,
  type ChampionDataRendererContext
} from './context'
import { createChampionDataApis } from './http-api'
import { OpggChampionDataController } from './opgg/data-controller'
import { Qq101ChampionDataController } from './qq101/data-controller'
import { Qq101ChampionDataLoader } from './qq101/data-loader'
import { syncChampionDataResources, syncChampionDataState } from './state-sync'

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
    @Config() private readonly _config?: ChampionDataRendererConfig
  ) {
    this._context = { ipc, piniaMobxUtils, logger }
    this.api = createChampionDataApis(protocol)
    this.opgg = new OpggChampionDataController(this._context)
    this.qq101 = new Qq101ChampionDataController(
      this._context,
      new Qq101ChampionDataLoader(logger, this.api.qq101)
    )
  }

  async onInit() {
    await syncChampionDataResources(this._context)

    if (this._config?.enableFullData) {
      await syncChampionDataState(this._context)
      this.qq101.start()
    }
  }

  async onDispose() {
    this.qq101.dispose()
  }
}
