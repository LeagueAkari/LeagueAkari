import { AkariProtocolRenderer } from '@renderer-shared/shards/akari-protocol'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { ChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import type { ChampionDataSourcePreferences } from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'

import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_RENDERER_NAMESPACE,
  type ChampionDataRendererContext
} from './context'
import { createChampionDataApis } from './http-api'
import { syncChampionDataState } from './state-sync'

@Shard(ChampionDataRenderer.id)
export class ChampionDataRenderer implements IAkariShardInitDispose {
  static id = CHAMPION_DATA_RENDERER_NAMESPACE

  public readonly context: ChampionDataRendererContext
  public readonly api: ReturnType<typeof createChampionDataApis>

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(AkariProtocolRenderer) protocol: AkariProtocolRenderer,
    @Dep(LoggerRenderer) logger: LoggerRenderer
  ) {
    this.context = { ipc, piniaMobxUtils, logger }
    this.api = createChampionDataApis(protocol)
  }

  async onInit() {
    await syncChampionDataState(this.context)
  }

  async onDispose() {}

  setAutomation(settings: ChampionDataAutomationSettings): Promise<void> {
    return this.context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setAutomation', settings)
  }

  setFlashPosition(value: OpggFlashPosition): Promise<void> {
    return this.context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setOpggFlashPosition', value)
  }

  setSourcePreferences(preferences: ChampionDataSourcePreferences): Promise<void> {
    return this.context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setSourcePreferences', preferences)
  }
}
