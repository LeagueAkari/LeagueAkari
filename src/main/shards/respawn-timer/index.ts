import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { GameClientMain } from '../game-client'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  RESPAWN_TIMER_MAIN_NAMESPACE,
  RESPAWN_TIMER_POLL_INTERVAL,
  type RespawnTimerMainContext
} from './context'
import { RespawnTimerController } from './respawn-timer-controller'
import { RespawnTimerSettings, RespawnTimerState } from './state'

@Shard(RespawnTimerMain.id)
export class RespawnTimerMain implements IAkariShardInitDispose {
  static id = RESPAWN_TIMER_MAIN_NAMESPACE

  static POLL_INTERVAL = RESPAWN_TIMER_POLL_INTERVAL

  public readonly settings = new RespawnTimerSettings()
  public readonly state: RespawnTimerState

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<RespawnTimerSettings>
  private readonly _context: RespawnTimerMainContext
  private readonly _controller: RespawnTimerController

  constructor(
    private readonly _gameClient: GameClientMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._logger = _loggerFactory.create(RespawnTimerMain.id)
    this._settingService = _settingFactory.register(
      RespawnTimerMain.id,
      {
        enabled: {
          default: false,
          sideEffect: ({ value }) => this._controller.applyEnabledSettingSideEffect(value)
        }
      },
      this.settings
    )
    this.state = new RespawnTimerState()

    this._context = {
      namespace: RespawnTimerMain.id,
      gameClient: this._gameClient,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings,
      settingService: this._settingService,
      state: this.state
    }
    this._controller = new RespawnTimerController(this._context)
  }

  async onInit() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(RespawnTimerMain.id, 'state', this.state, ['info'])
    this._mobxUtils.propSync(RespawnTimerMain.id, 'settings', this.settings, ['enabled'])

    this._controller.watch()
  }

  async onDispose() {
    this._controller.dispose()
  }
}
