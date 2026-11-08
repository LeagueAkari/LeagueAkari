import { AkariProtocolRenderer } from '@renderer-shared/shards/akari-protocol'
import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Qq101DataSource } from '@shared/data-sources/qq101'
import type { ChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import type { ChampionDataSourcePreferences } from '@shared/types/champion-data'
import { onScopeDispose } from 'vue'

import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_RENDERER_NAMESPACE,
  type ChampionDataRendererContext
} from './context'
import { CurrentGameController } from './current-game-controller'
import { createChampionDataApis } from './http-api'
import { LoadoutExecutor } from './loadout-executor'
import { useOpggCurrentGame } from './opgg/current-game'
import { OpggChampionDataController } from './opgg/data-controller'
import { OpggChampionDataLoader } from './opgg/data-loader'
import { useQq101CurrentGame } from './qq101/current-game'
import { Qq101ChampionDataController } from './qq101/data-controller'
import { Qq101ChampionDataLoader } from './qq101/data-loader'
import type { ChampionDataCommands } from './source-contract'
import { syncChampionDataState } from './state-sync'
import { useChampionDataStore } from './store'

@Shard(ChampionDataRenderer.id)
export class ChampionDataRenderer implements IAkariShardInitDispose {
  static id = CHAMPION_DATA_RENDERER_NAMESPACE

  private readonly _executor: LoadoutExecutor
  private readonly _context: ChampionDataRendererContext

  public readonly currentGame: CurrentGameController
  public readonly commands: ChampionDataCommands

  public readonly api: ReturnType<typeof createChampionDataApis>

  public readonly opgg: OpggChampionDataController
  public readonly qq101: Qq101ChampionDataController

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(AkariProtocolRenderer) protocol: AkariProtocolRenderer,
    @Dep(LoggerRenderer) logger: LoggerRenderer,
    @Dep(LeagueClientRenderer) leagueClient: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = { ipc, piniaMobxUtils, logger }

    this._executor = new LoadoutExecutor(leagueClient)
    this.commands = this._executor

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
      new OpggChampionDataLoader(this.api.opgg),
      this._executor
    )

    this.qq101 = new Qq101ChampionDataController(
      this._context,
      new Qq101ChampionDataLoader(logger, new Qq101DataSource(this.api.qq101)),
      this.commands
    )

    this.currentGame = new CurrentGameController(
      this._context,
      {
        opgg: (input) => useOpggCurrentGame(input, this.opgg),
        qq101: (input) => useQq101CurrentGame(input, this.qq101.pages)
      },
      this._executor
    )
  }

  async onInit() {
    await syncChampionDataState(this._context)

    this._setupInAppScope.addSetupFn(this._setupWindow)
  }

  async onDispose() {}

  private readonly _setupWindow = () => {
    this.opgg.setup()
    this.qq101.setup()

    this.currentGame.setup()

    onScopeDispose(() => this._executor.dispose())
  }

  setAutomation(settings: ChampionDataAutomationSettings): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setAutomation', settings)
  }

  setSourcePreferences(preferences: ChampionDataSourcePreferences): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setSourcePreferences', preferences)
  }
}
