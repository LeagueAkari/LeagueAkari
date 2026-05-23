import { riotId, summonerName } from '@shared/utils/name'
import { comparer, runInAction } from 'mobx'

import { RESPAWN_TIMER_POLL_INTERVAL, type RespawnTimerMainContext } from './context'

export class RespawnTimerController {
  private _timerId: NodeJS.Timeout | null = null
  private _isStarted = false

  constructor(private readonly context: RespawnTimerMainContext) {}

  watch() {
    this._watchEnabledSetting()
    this._watchGameflow()
  }

  dispose() {
    this._stopRespawnTimerPoll()
  }

  private _watchEnabledSetting() {
    const { leagueClient, settingService, settings } = this.context

    settingService.onChange('enabled', async (v, { setter }) => {
      if (v && leagueClient.data.gameflow.phase === 'InProgress') {
        this._startRespawnTimerPoll()
      } else if (v === false) {
        this._stopRespawnTimerPoll()
      }

      settings.setEnabled(v)
      await setter()
    })
  }

  private _watchGameflow() {
    const { leagueClient, mobxUtils, settings, state } = this.context

    mobxUtils.reaction(
      () => [leagueClient.data.gameflow.phase, settings.enabled],
      ([phase, enabled]) => {
        if (phase === 'InProgress') {
          if (enabled) {
            this._startRespawnTimerPoll()
          }
        } else {
          runInAction(() => {
            state.info = {
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

  private async _queryRespawnTime() {
    const { gameClient, leagueClient, logger, state } = this.context

    if (!leagueClient.data.summoner.me) {
      logger.warn('Seems like summoner info is not loaded')
      return
    }

    try {
      const playerList = (await gameClient.api.getLiveClientDataPlayerList()).data
      const self = playerList.find((p) => {
        if (p.riotId) {
          return p.riotId === riotId(leagueClient.data.summoner.me)
        }

        if (p.summonerName) {
          return summonerName(p.summonerName) === riotId(leagueClient.data.summoner.me)
        }

        return p.summonerName === leagueClient.data.summoner.me?.internalName
      })

      if (self) {
        if (!state.info.isDead && self.isDead) {
          runInAction(() => (state.info.totalTime = self.respawnTimer))
        }

        runInAction(() => {
          state.info = {
            isDead: self.isDead,
            timeLeft: self.respawnTimer,
            totalTime: state.info.totalTime
          }
        })
      }
    } catch {}
  }

  private _startRespawnTimerPoll() {
    if (this._isStarted) {
      return
    }

    this.context.logger.info('Respawn timer polling started')

    this._isStarted = true
    this._queryRespawnTime()
    this._timerId = setInterval(() => this._queryRespawnTime(), RESPAWN_TIMER_POLL_INTERVAL)
  }

  private _stopRespawnTimerPoll() {
    if (!this._isStarted) {
      return
    }

    this.context.logger.info('Respawn timer polling stopped')

    this._isStarted = false
    if (this._timerId) {
      clearInterval(this._timerId)
      this._timerId = null
    }

    runInAction(() => {
      this.context.state.info = {
        isDead: false,
        timeLeft: 0,
        totalTime: 0
      }
    })
  }
}
