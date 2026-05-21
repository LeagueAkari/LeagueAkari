import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { QueueKeeper } from '@shared/utils/queue-keeper'
import { comparer } from 'mobx'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SavedPlayerMain } from '../saved-player'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SgpMain } from '../sgp'
import { OngoingGameAdditionalInfoController } from './additional-info-controller'
import { OngoingGameAnalysisController } from './analysis-controller'
import { OngoingGameChampSelectHandoffController } from './champ-select-handoff-controller'
import {
  ONGOING_GAME_LOADING_PRIORITY,
  ONGOING_GAME_MAIN_NAMESPACE,
  type OngoingGameMainContext
} from './context'
import { OngoingGameIpcHandlers } from './ipc-handlers'
import { OngoingGameMatchHistoryLoader } from './match-history-loader'
import { OngoingGamePlayerDataLoader } from './player-data-loader'
import { OngoingGameSideEffectsController } from './side-effects-controller'
import { OngoingGameSettings, OngoingGameState } from './state'

/**
 * 用于游戏过程中的对局分析, 包括在此期间的战绩查询, 计算等
 */
@Shard(OngoingGameMain.id)
export class OngoingGameMain implements IAkariShardInitDispose {
  static id = ONGOING_GAME_MAIN_NAMESPACE
  static LOADING_PRIORITY = ONGOING_GAME_LOADING_PRIORITY

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService

  public readonly settings: OngoingGameSettings
  public readonly state: OngoingGameState

  private readonly _queueKeeper = new QueueKeeper([{ id: 'match-history' }, { id: 'misc' }])
  private readonly _context: OngoingGameMainContext

  private readonly _matchHistory: OngoingGameMatchHistoryLoader
  private readonly _playerData: OngoingGamePlayerDataLoader
  private readonly _analysis: OngoingGameAnalysisController
  private readonly _additionalInfo: OngoingGameAdditionalInfoController
  private readonly _sideEffects: OngoingGameSideEffectsController
  private readonly _champSelectHandoff: OngoingGameChampSelectHandoffController
  private readonly _ipcHandlers: OngoingGameIpcHandlers

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _sgpMain: SgpMain,
    private readonly _savedPlayer: SavedPlayerMain,
    private readonly _appCommon: AppCommonMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this.settings = new OngoingGameSettings()
    this._logger = _loggerFactory.create(OngoingGameMain.id)
    this._settingService = _settingFactory.register(
      OngoingGameMain.id,
      {
        concurrency: { default: this.settings.concurrency },
        enabled: { default: this.settings.enabled },
        matchHistoryLoadCount: { default: this.settings.matchHistoryLoadCount },
        matchHistoryTagPreference: { default: this.settings.matchHistoryTagPreference },
        gameDetailsLoadCount: { default: this.settings.gameDetailsLoadCount },
        orderPlayerBy: { default: this.settings.orderPlayerBy },
        showChampionUsage: { default: this.settings.showChampionUsage },
        showMatchHistoryItemBorder: { default: this.settings.showMatchHistoryItemBorder },
        showJunglePathingForAllPlayers: {
          default: this.settings.showJunglePathingForAllPlayers
        },
        autoRouteWhenGameStarts: { default: this.settings.autoRouteWhenGameStarts },
        playerCardTags: { default: this.settings.playerCardTags },
        queryInLobbyPhase: { default: this.settings.queryInLobbyPhase },
        premadeTeamInferMatchCountThreshold: {
          default: this.settings.premadeTeamInferMatchCountThreshold
        }
      },
      this.settings
    )
    this.state = new OngoingGameState(
      this._leagueClient.data,
      this._appCommon,
      this._sgpMain,
      this.settings,
      this._remoteConfig
    )

    this._context = {
      namespace: OngoingGameMain.id,
      settings: this.settings,
      state: this.state,
      queueKeeper: this._queueKeeper,
      logger: this._logger,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      settingService: this._settingService,
      leagueClient: this._leagueClient,
      sgp: this._sgpMain,
      savedPlayer: this._savedPlayer,
      remoteConfig: this._remoteConfig
    }

    this._matchHistory = new OngoingGameMatchHistoryLoader(this._context)
    this._playerData = new OngoingGamePlayerDataLoader(this._context, this._matchHistory)
    this._analysis = new OngoingGameAnalysisController(this._context)
    this._additionalInfo = new OngoingGameAdditionalInfoController(this._context)
    this._sideEffects = new OngoingGameSideEffectsController(this._context)
    this._champSelectHandoff = new OngoingGameChampSelectHandoffController(this._context)
    this._ipcHandlers = new OngoingGameIpcHandlers(
      this._context,
      this._matchHistory,
      this._playerData,
      this._additionalInfo
    )
  }

  private async _setupState() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(OngoingGameMain.id, 'settings', this.settings, [
      'concurrency',
      'enabled',
      'matchHistoryLoadCount',
      'matchHistoryTagPreference',
      'gameDetailsLoadCount',
      'orderPlayerBy',
      'showChampionUsage',
      'showMatchHistoryItemBorder',
      'showJunglePathingForAllPlayers',
      'autoRouteWhenGameStarts',
      'playerCardTags',
      'queryInLobbyPhase',
      'premadeTeamInferMatchCountThreshold'
    ])

    this._mobxUtils.propSync(OngoingGameMain.id, 'state', this.state, [
      'championSelections',
      'positionAssignments',
      'analysis',
      'queryStage',
      'teams',
      'isInEog',
      'matchHistoryLoadingState',
      'summonerLoadingState',
      'savedInfoLoadingState',
      'rankedStatsLoadingState',
      'championMasteryLoadingState',
      'teamParticipantGroups',
      'matchHistoryTagParams',
      'draft',
      'additional',
      'mergedPremadeTeamMap',
      'inferredPremadeTeams'
    ])

    // 便于精准订阅
    this._mobxUtils.propSync(OngoingGameMain.id, 'additional', this.state, ['additional'])
  }

  async onInit() {
    await this._setupState()
    await this._champSelectHandoff.init()

    this._watchConcurrencyChange()
    this._ipcHandlers.register()
    this._champSelectHandoff.watch()
    this._analysis.watch()
    this._sideEffects.watch()
    this._playerData.watch()
    this._matchHistory.watch()
    this._watchUnavailableState()
    this._additionalInfo.watch()
    this._watchSettingValidation()
  }

  private _watchConcurrencyChange() {
    this._mobxUtils.reaction(
      () => this.settings.concurrency,
      (concurrency) => {
        this._queueKeeper.setConcurrency('match-history', concurrency)
        this._queueKeeper.setConcurrency('misc', concurrency)
      },
      { fireImmediately: true }
    )
  }

  private _watchUnavailableState() {
    this._mobxUtils.reaction(
      () => this.state.queryStage.phase === 'unavailable',
      (isUnavailable) => {
        if (isUnavailable) {
          this._logger.info('Clearing ongoing game state')
          this._queueKeeper.cancelAll()
          this.state.clear()
          this._ipc.sendEvent(OngoingGameMain.id, 'clear')
          return
        }
      },
      { equals: comparer.shallow }
    )
  }

  private _watchSettingValidation() {
    this._settingService.onChange('matchHistoryLoadCount', async (value, { setter }) => {
      if (value >= 1 && value <= 200) {
        await setter(value)
      }

      this._settingService.set(
        'gameDetailsLoadCount',
        Math.min(value, this.settings.gameDetailsLoadCount)
      )
    })

    this._settingService.onChange('gameDetailsLoadCount', async (value, { setter }) => {
      if (value >= 0 && value <= this.settings.matchHistoryLoadCount) {
        await setter(value)
        return
      }

      await setter(this.settings.matchHistoryLoadCount)
    })
  }
}
