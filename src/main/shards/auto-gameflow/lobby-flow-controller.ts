import { formatError } from '@shared/utils/errors'
import { comparer } from 'mobx'

import type { AutoGameflowActionController } from './action-controller'
import {
  AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT,
  AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT,
  AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT,
  type AutoGameflowMainContext
} from './context'

export class AutoGameflowLobbyFlowController {
  constructor(
    private readonly _context: AutoGameflowMainContext,
    private readonly _actionController: AutoGameflowActionController
  ) {}

  watch() {
    this._watchAutoAccept()
    this._watchAutoPlayAgain()
    this._watchAutoReconnect()
    this._watchPreEndOfGame()
  }

  private _watchAutoAccept() {
    const { leagueClient, logger, mobxUtils, settings, state } = this._context

    mobxUtils.reaction(
      () => leagueClient.data.gameflow.phase,
      (phase) => {
        if (!settings.autoAcceptEnabled) {
          return
        }

        if (phase === 'ReadyCheck') {
          const delay = settings.autoAcceptDelaySeconds * 1e3
          state.setAcceptAt(Date.now() + delay)
          this._actionController.startAutoAccept(delay)

          logger.info(`ReadyCheck! Will accept in ${settings.autoAcceptDelaySeconds} seconds`)
        } else {
          if (this._actionController.isAutoAcceptStarted) {
            logger.info(`Cancelled upcoming auto-accept - not in ReadyCheck phase`)
            this._actionController.cancelAutoAcceptTask()
          }
          state.clearAutoAccept()
        }
      },
      { fireImmediately: true }
    )

    mobxUtils.reaction(
      () => settings.autoAcceptEnabled,
      (enabled) => {
        if (!enabled) {
          this._actionController.cancelAutoAccept('normal')
        }
      },
      { fireImmediately: true }
    )

    leagueClient.events.on('/lol-matchmaking/v1/ready-check', (event) => {
      if (
        event.data &&
        (event.data.playerResponse === 'Declined' || event.data.playerResponse === 'Accepted')
      ) {
        this._actionController.cancelAutoAccept(event.data.playerResponse.toLowerCase())
      }
    })
  }

  private _watchAutoPlayAgain() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => [leagueClient.data.gameflow.phase, settings.playAgainEnabled] as const,
      async ([phase, enabled]) => {
        if (
          !enabled ||
          (phase !== 'WaitingForStats' && phase !== 'PreEndOfGame' && phase !== 'EndOfGame')
        ) {
          this._actionController.cancelPlayAgain()
          return
        }

        // 如果停留在结算页面时间过长，将考虑返回
        if (phase === 'WaitingForStats' && enabled) {
          logger.info(
            `In WaitingForStats, waiting for ${AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT} ms`
          )
          this._actionController.startPlayAgain(AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT)
          return
        }

        // 在某些模式中，可能会出现仅有 PreEndOfGame 的情况，需要做一个计时器
        if (phase === 'PreEndOfGame' && enabled) {
          logger.info(
            `Waiting for ballot event ${AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT} ms`
          )
          this._actionController.startPlayAgain(AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT)
          return
        }

        if (phase === 'EndOfGame' && enabled) {
          logger.info(`Will return to lobby in ${AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT} ms`)
          this._actionController.startPlayAgain(AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT)
          return
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  private _watchAutoReconnect() {
    const { leagueClient, logger, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => [leagueClient.data.gameflow.phase, settings.autoReconnectEnabled] as const,
      ([phase, enabled]) => {
        if (phase === 'Reconnect' && enabled) {
          logger.info('Will attempt to reconnect in a short delay')
          this._actionController.scheduleReconnect(10000)
        } else {
          this._actionController.cancelReconnect()
        }
      }
    )
  }

  private _watchPreEndOfGame() {
    const { leagueClient, logger, settings } = this._context

    leagueClient.events.on('/lol-pre-end-of-game/v1/currentSequenceEvent', async (event) => {
      if (event.data) {
        // TODO: 暂时将 missions-celebration 合并到 play-again 逻辑设置下
        if (settings.playAgainEnabled && event.data.name === 'missions-celebration') {
          logger.info(
            'PreEndOfGame currentSequenceEvent: missions-celebration, attempting to complete'
          )
          try {
            await leagueClient.api.preEndOfGame.complete('missions-celebration')
          } catch (error) {
            logger.warn(`Failed to complete missions-celebration: ${formatError(error)}`)
          }
        }
      }
    })
  }
}
