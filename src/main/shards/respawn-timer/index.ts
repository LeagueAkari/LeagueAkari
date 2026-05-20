import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { riotId, summonerName } from '@shared/utils/name'
import { comparer, runInAction } from 'mobx'

import { GameClientMain } from '../game-client'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { RespawnTimerSettings, RespawnTimerState } from './state'

@Shard(RespawnTimerMain.id)
export class RespawnTimerMain implements IAkariShardInitDispose {
  static id = 'respawn-timer-main'

  static POLL_INTERVAL = 1000

  public readonly settings = new RespawnTimerSettings()
  public readonly state: RespawnTimerState

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService

  private _timerId: NodeJS.Timeout
  private _isStarted = false

  constructor(
    private readonly _gameClient: GameClientMain,
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    readonly _settingFactory: SettingFactoryMain
  ) {
    this._logger = _loggerFactory.create(RespawnTimerMain.id)
    this._settingService = _settingFactory.register(
      RespawnTimerMain.id,
      {
        enabled: { default: false }
      },
      this.settings
    )
    this.state = new RespawnTimerState()
  }

  async onInit() {
    await this._settingService.applyToState()

    this._settingService.onChange('enabled', async (v, { setter }) => {
      if (v && this._leagueClient.data.gameflow.phase === 'InProgress') {
        this._startRespawnTimerPoll()
      } else if (v === false) {
        this._stopRespawnTimerPoll()
      }

      this.settings.setEnabled(v)
      await setter()
    })

    this._mobxUtils.propSync(RespawnTimerMain.id, 'state', this.state, ['info'])
    this._mobxUtils.propSync(RespawnTimerMain.id, 'settings', this.settings, ['enabled'])

    this._mobxUtils.reaction(
      () => [this._leagueClient.data.gameflow.phase, this.settings.enabled],
      ([phase, enabled]) => {
        if (phase === 'InProgress') {
          if (enabled) {
            this._startRespawnTimerPoll()
          }
        } else {
          runInAction(() => {
            this.state.info = {
              isDead: false,
              timeLeft: 0,
              totalTime: 0
            }
          })
          this._stopRespawnTimerPoll()
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  async onDispose() {
    this._stopRespawnTimerPoll()
  }

  private async _queryRespawnTime() {
    if (!this._leagueClient.data.summoner.me) {
      this._logger.warn('Seems like summoner info is not loaded')
      return
    }

    try {
      const playerList = (await this._gameClient.api.getLiveClientDataPlayerList()).data
      const self = playerList.find((p) => {
        if (p.riotId) {
          return p.riotId === riotId(this._leagueClient.data.summoner.me)
        }

        if (p.summonerName) {
          return summonerName(p.summonerName) === riotId(this._leagueClient.data.summoner.me)
        }

        return p.summonerName === this._leagueClient.data.summoner.me?.internalName
      })

      if (self) {
        if (!this.state.info.isDead && self.isDead) {
          runInAction(() => (this.state.info.totalTime = self.respawnTimer))
        }

        runInAction(() => {
          this.state.info = {
            isDead: self.isDead,
            timeLeft: self.respawnTimer,
            totalTime: this.state.info.totalTime
          }
        })
      }
    } catch {}
  }

  private _startRespawnTimerPoll() {
    if (this._isStarted) {
      return
    }

    this._logger.info('Respawn timer polling started')

    this._isStarted = true
    this._queryRespawnTime()
    this._timerId = setInterval(() => this._queryRespawnTime(), RespawnTimerMain.POLL_INTERVAL)
  }

  private _stopRespawnTimerPoll() {
    if (!this._isStarted) {
      return
    }

    this._logger.info('Respawn timer polling stopped')

    this._isStarted = false
    clearInterval(this._timerId)

    runInAction(() => {
      this.state.info = {
        isDead: false,
        timeLeft: 0,
        totalTime: 0
      }
    })
  }
}
