import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import {
  OPGG_CHAMPION_DATA_MODES,
  OPGG_RANKED_POSITIONS,
  OPGG_REGIONS,
  OPGG_TIER_FILTERS
} from '@shared/types/opgg'
import { makeAutoObservable } from 'mobx'
import { z } from 'zod'

import { AkariProtocolMain } from '../akari-protocol'
import { ExtraAssetsMain } from '../extra-assets'
import { FeatureGatingMain } from '../feature-gating'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { type AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { NetworkMain } from '../network'
import { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import { WindowManagerMain } from '../window-manager'
import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_OPGG_NAMESPACE,
  CHAMPION_DATA_QQ101_FEATURE_GATE,
  type ChampionDataMainContext
} from './context'
import { ChampionDataIpcHandlers } from './ipc-handlers'
import { OpggAramBalanceLoader } from './opgg/aram-balance-loader'
import { OpggChampionDataController } from './opgg/data-controller'
import { OpggChampionDataLoader } from './opgg/data-loader'
import { OpggLoadoutExecutor } from './opgg/loadout-executor'
import { ChampionDataProtocolController } from './protocol-controller'
import { ChampionDataSettings, OpggChampionDataState } from './state'

const opggPreferencesSchema: z.ZodType<OpggChampionDataPreferences> = z.object({
  mode: z.enum(OPGG_CHAMPION_DATA_MODES),
  position: z.enum(OPGG_RANKED_POSITIONS),
  region: z.enum(OPGG_REGIONS),
  tier: z.enum(OPGG_TIER_FILTERS)
})

const qq101PreferencesSchema: z.ZodType<Qq101ChampionDataPreferences> = z.object({
  mode: z.enum(['ranked', 'classic', 'aram', 'aram_mayhem']),
  position: z.enum(['all', 'top', 'jungle', 'middle', 'bottom', 'utility']),
  patch: z.string().min(1).nullable(),
  tier: z.number().int()
})

@Shard(ChampionDataMain.id)
export class ChampionDataMain implements IAkariShardInitDispose {
  static id = CHAMPION_DATA_MAIN_NAMESPACE

  public readonly settings = new ChampionDataSettings()
  public readonly opgg = new OpggChampionDataState()
  public readonly qq101 = makeAutoObservable({ enabled: false })
  private readonly _protocolController: ChampionDataProtocolController

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<ChampionDataSettings>
  private readonly _context: ChampionDataMainContext
  private readonly _ipcHandlers: ChampionDataIpcHandlers
  private readonly _opggAramBalanceLoader: OpggAramBalanceLoader
  private readonly _opggController: OpggChampionDataController
  private readonly _opggLoadout: OpggLoadoutExecutor

  constructor(
    private readonly _network: NetworkMain,
    private readonly _protocol: AkariProtocolMain,
    private readonly _featureGating: FeatureGatingMain,
    private readonly _ipc: AkariIpcMain,
    loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    settingFactory: SettingFactoryMain,
    leagueClient: LeagueClientMain,
    extraAssets: ExtraAssetsMain,
    windowManager: WindowManagerMain
  ) {
    this._logger = loggerFactory.create(ChampionDataMain.id)
    this._settingService = settingFactory.register(
      ChampionDataMain.id,
      {
        opggFlashPosition: {
          default: this.settings.opggFlashPosition,
          schema: z.enum(['auto', 'd', 'f'])
        },
        opggPreferences: {
          default: this.settings.opggPreferences,
          schema: opggPreferencesSchema
        },
        qq101Preferences: {
          default: this.settings.qq101Preferences,
          schema: qq101PreferencesSchema
        }
      },
      this.settings
    )

    this._context = {
      namespace: ChampionDataMain.id,
      featureGating: this._featureGating,
      logger: this._logger,
      settingService: this._settingService
    }

    this._protocolController = new ChampionDataProtocolController(
      this._context,
      this._protocol,
      this._network
    )
    const opggContext = {
      ...this._context,
      settings: this.settings,
      state: this.opgg,
      leagueClient,
      extraAssets,
      windowManager,
      mobxUtils: this._mobxUtils
    }
    this._opggAramBalanceLoader = new OpggAramBalanceLoader(
      opggContext,
      this._protocolController.opggApi
    )
    this._opggController = new OpggChampionDataController(
      opggContext,
      new OpggChampionDataLoader(this._protocolController.opggApi)
    )
    this._opggLoadout = new OpggLoadoutExecutor(opggContext)
    this._ipcHandlers = new ChampionDataIpcHandlers(
      this._context,
      this._ipc,
      this._opggController,
      this._opggLoadout
    )
  }

  async onInit() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(ChampionDataMain.id, 'settings', this.settings, [
      'opggFlashPosition',
      'opggPreferences',
      'qq101Preferences'
    ])
    this._mobxUtils.propSync(CHAMPION_DATA_OPGG_NAMESPACE, 'state', this.opgg, [
      'enabled',
      'snapshot',
      'isApplying'
    ])
    this._mobxUtils.propSync(ChampionDataMain.id + '/qq101', 'state', this.qq101, ['enabled'])

    this._mobxUtils.propSync(CHAMPION_DATA_OPGG_NAMESPACE, 'resources', this.opgg, ['aramBalance'])

    this._opggAramBalanceLoader.start()
    this._watchFeatureGates()
    this._opggController.start()

    this._ipcHandlers.register()
    this._protocolController.register()
  }

  async onDispose() {
    this._opggAramBalanceLoader.dispose()
    this._opggController.dispose()
    this._protocolController.unregister()
  }

  private _watchFeatureGates() {
    this._mobxUtils.reaction(
      () => this._featureGating.getEvaluation(CHAMPION_DATA_OPGG_FEATURE_GATE, false),
      (evaluation) => {
        this.opgg.enabled = evaluation.enabled
      },
      { fireImmediately: true }
    )
    this._mobxUtils.reaction(
      () => this._featureGating.getEvaluation(CHAMPION_DATA_QQ101_FEATURE_GATE, false),
      (evaluation) => {
        this.qq101.enabled = evaluation.enabled
      },
      { fireImmediately: true }
    )
  }
}
