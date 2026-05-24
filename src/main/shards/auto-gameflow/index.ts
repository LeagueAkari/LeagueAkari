import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoGameflowActionController } from './action-controller'
import { AutoGameflowAramTeamSideController } from './aram-team-side-controller'
import {
  AUTO_GAMEFLOW_HONOR_CATEGORY,
  AUTO_GAMEFLOW_MAIN_NAMESPACE,
  AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT,
  AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT,
  AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT,
  type AutoGameflowMainContext
} from './context'
import { AutoGameflowHonorController } from './honor-controller'
import { AutoGameflowInvitationController } from './invitation-controller'
import { AutoGameflowIpcHandlers } from './ipc-handlers'
import { AutoGameflowLobbyFlowController } from './lobby-flow-controller'
import { AutoGameflowMatchmakingController } from './matchmaking-controller'
import { AutoGameflowSettings, AutoGameflowState } from './state'

/**
 * 自动游戏流程相关功能
 */
@Shard(AutoGameflowMain.id)
export class AutoGameflowMain implements IAkariShardInitDispose {
  static id = AUTO_GAMEFLOW_MAIN_NAMESPACE

  static HONOR_CATEGORY = AUTO_GAMEFLOW_HONOR_CATEGORY

  static PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT
  static PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT = AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT
  static PLAY_AGAIN_BUFFER_TIMEOUT = AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT

  public readonly settings = new AutoGameflowSettings()
  public readonly state: AutoGameflowState

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AutoGameflowMainContext

  private readonly _actionController: AutoGameflowActionController
  private readonly _matchmaking: AutoGameflowMatchmakingController
  private readonly _lobbyFlow: AutoGameflowLobbyFlowController
  private readonly _invitations: AutoGameflowInvitationController
  private readonly _honorController: AutoGameflowHonorController
  private readonly _aramTeamSide: AutoGameflowAramTeamSideController
  private readonly _ipcHandlers: AutoGameflowIpcHandlers

  constructor(
    loggerFactory: LoggerFactoryMain,
    settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._logger = loggerFactory.create(AutoGameflowMain.id)
    this.state = new AutoGameflowState(this._leagueClient.data, this.settings)
    this._settingService = settingFactory.register(
      AutoGameflowMain.id,
      {
        autoAcceptDelaySeconds: { default: this.settings.autoAcceptDelaySeconds },
        autoAcceptEnabled: { default: this.settings.autoAcceptEnabled },
        autoHonorEnabled: { default: this.settings.autoHonorEnabled },
        autoHonorStrategy: { default: this.settings.autoHonorStrategy },
        autoMatchmakingDelaySeconds: { default: this.settings.autoMatchmakingDelaySeconds },
        autoMatchmakingEnabled: { default: this.settings.autoMatchmakingEnabled },
        autoMatchmakingMaximumMatchDuration: {
          default: this.settings.autoMatchmakingMaximumMatchDuration
        },
        autoMatchmakingMinimumMembers: { default: this.settings.autoMatchmakingMinimumMembers },
        playAgainEnabled: { default: this.settings.playAgainEnabled },
        autoReconnectEnabled: { default: this.settings.autoReconnectEnabled },
        autoMatchmakingRematchFixedDuration: {
          default: this.settings.autoMatchmakingRematchFixedDuration
        },
        autoSkipLeaderEnabled: {
          default: this.settings.autoSkipLeaderEnabled
        },
        autoMatchmakingRematchStrategy: { default: this.settings.autoMatchmakingRematchStrategy },
        autoMatchmakingWaitForInvitees: { default: this.settings.autoMatchmakingWaitForInvitees },
        autoHandleInvitationsEnabled: { default: this.settings.autoHandleInvitationsEnabled },
        invitationHandlingStrategies: { default: this.settings.invitationHandlingStrategies },
        rejectInvitationWhenAway: { default: this.settings.rejectInvitationWhenAway },
        autoSendARAMTeamSideEnabled: { default: this.settings.autoSendARAMTeamSideEnabled },
        autoSendARAMTeamSideVisibleToTeam: {
          default: this.settings.autoSendARAMTeamSideVisibleToTeam
        }
      },
      this.settings
    )

    this._context = {
      namespace: AutoGameflowMain.id,
      settings: this.settings,
      state: this.state,
      logger: this._logger,
      settingService: this._settingService,
      leagueClient: this._leagueClient,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc
    }

    this._actionController = new AutoGameflowActionController(this._context)
    this._matchmaking = new AutoGameflowMatchmakingController(this._context)
    this._lobbyFlow = new AutoGameflowLobbyFlowController(this._context, this._actionController)
    this._invitations = new AutoGameflowInvitationController(this._context)
    this._honorController = new AutoGameflowHonorController(this._context, this._actionController)
    this._aramTeamSide = new AutoGameflowAramTeamSideController(this._context)
    this._ipcHandlers = new AutoGameflowIpcHandlers(
      this._context,
      this._actionController,
      this._matchmaking
    )
  }

  private _watchLogging() {
    // 监听 gameflow
    this._mobxUtils.reaction(
      () => this._leagueClient.data.gameflow.phase,
      (phase) => {
        this._logger.info(`Gameflow phase changed: ${phase}`)
      }
    )
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._settingService.onChange('autoAcceptEnabled', async (value, { setter }) => {
      if (!value) {
        this._actionController.cancelAutoAccept('normal')
      }

      this.settings.setAutoAcceptEnabled(value)
      await setter()
    })

    this._mobxUtils.propSync(AutoGameflowMain.id, 'settings', this.settings, [
      'autoAcceptDelaySeconds',
      'autoAcceptEnabled',
      'autoHonorEnabled',
      'autoHonorStrategy',
      'autoMatchmakingDelaySeconds',
      'autoMatchmakingEnabled',
      'autoMatchmakingMinimumMembers',
      'autoMatchmakingRematchFixedDuration',
      'autoMatchmakingRematchStrategy',
      'autoMatchmakingWaitForInvitees',
      'autoSkipLeaderEnabled',
      'playAgainEnabled',
      'autoHandleInvitationsEnabled',
      'autoReconnectEnabled',
      'autoMatchmakingMaximumMatchDuration',
      'invitationHandlingStrategies',
      'rejectInvitationWhenAway',
      'autoSendARAMTeamSideEnabled',
      'autoSendARAMTeamSideVisibleToTeam'
    ])

    this._mobxUtils.propSync(AutoGameflowMain.id, 'state', this.state, [
      'willAcceptAt',
      'willSearchMatch',
      'willSearchMatchAt',
      'activityStartStatus',
      'friendsToBeInvited'
    ])
  }

  cancelAutoAccept(reason?: string) {
    this._actionController.cancelAutoAccept(reason)
  }

  cancelAutoMatchmaking(reason?: string) {
    this._matchmaking.cancelAutoMatchmaking(reason)
  }

  async onInit() {
    await this._setupState()
    this._ipcHandlers.register()
    this._honorController.watch()
    this._lobbyFlow.watch()
    this._invitations.watch()
    this._matchmaking.watch()
    this._aramTeamSide.watch()
    this._watchLogging()
  }

  async onDispose() {}
}
