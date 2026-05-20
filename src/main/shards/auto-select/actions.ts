import { i18next } from '@main/i18n'

import type { AutoSelectMainContext } from './context'
import type { AutoSelectLocalMessageService } from './local-message-service'

export class AutoSelectActions {
  constructor(
    private readonly _context: AutoSelectMainContext,
    private readonly _localMessage: AutoSelectLocalMessageService
  ) {}

  championNameWithId(id: number) {
    return `${this._context.leagueClient.data.gameData.championName(id)} (${id})`
  }

  async ban(championId: number, actionId: number, completed: boolean) {
    const { leagueClient, logger } = this._context

    try {
      logger.info(`Banning ${this.championNameWithId(championId)} completed=${completed}`)

      await leagueClient.api.champSelect.action(actionId, {
        type: 'ban',
        championId,
        completed
      })
    } catch (error: any) {
      logger.warn(
        `Failed to ban champion ${this.championNameWithId(championId)} completed=${completed}`,
        error
      )
      this._localMessage.send(
        i18next.t('auto-select-main.error-ban', {
          champion: this.championNameWithId(championId),
          reason: error.message
        })
      )
    }
  }

  async pick(championId: number, actionId: number, completed?: boolean) {
    const { leagueClient, logger } = this._context

    try {
      logger.info(`Picking ${this.championNameWithId(championId)} completed=${completed}`)

      await leagueClient.api.champSelect.action(actionId, {
        type: 'pick',
        championId,
        completed
      })
    } catch (error: any) {
      logger.warn(
        `Failed to pick champion ${this.championNameWithId(championId)} completed=${completed}`,
        error
      )
      this._localMessage.send(
        i18next.t('auto-select-main.error-pick', {
          champion: this.championNameWithId(championId),
          reason: error.message
        })
      )
    }
  }

  async intent(championId: number, actionId: number) {
    const { leagueClient, logger } = this._context

    try {
      logger.info(`Intenting ${this.championNameWithId(championId)}`)
      await leagueClient.api.champSelect.action(actionId, { championId })
    } catch (error: any) {
      logger.warn(`Failed to intent champion ${this.championNameWithId(championId)}`, error)
      this._localMessage.send(
        i18next.t('auto-select-main.error-intent', {
          champion: this.championNameWithId(championId),
          reason: error.message
        })
      )
    }
  }

  async benchSwap(championId: number) {
    const { leagueClient, logger } = this._context

    try {
      logger.info(`Swapped champion: ${championId}`)
      await leagueClient.api.champSelect.benchSwap(championId)
    } catch (error) {
      logger.warn(`Failed to swap champion`, error)
    }
  }

  async acceptChampionSwap(tradeId: number) {
    const { leagueClient, logger } = this._context

    try {
      await leagueClient.api.champSelect.acceptChampionSwap(tradeId)
    } catch (error) {
      logger.warn(`Failed to accept champion swap`, error)
    }
  }

  async declineChampionSwap(tradeId: number) {
    const { leagueClient, logger } = this._context

    try {
      await leagueClient.api.champSelect.declineChampionSwap(tradeId)
    } catch (error) {
      logger.warn(`Failed to decline champion swap`, error)
    }
  }
}
