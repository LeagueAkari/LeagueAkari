import { TimeoutTask } from '@main/utils/timer'
import { parseOpggAramBalance } from '@shared/data-adapter/opgg'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'

import { OPGG_ARAM_BALANCE_UPDATE_INTERVAL, type OpggResourceContext } from '../context'

export class OpggAramBalanceLoader {
  private readonly _refreshTask = new TimeoutTask(() => {
    void this._load()
  })
  private readonly _abortController = new AbortController()

  constructor(
    private readonly _context: Pick<OpggResourceContext, 'state' | 'logger'>,
    private readonly _api: OpggHttpApiAxiosHelper
  ) {}

  start() {
    void this._load()
  }

  dispose() {
    this._abortController.abort()
    this._refreshTask.cancel()
  }

  private async _load() {
    const { signal } = this._abortController
    const { state, logger } = this._context

    try {
      logger.info('OP.GG: updating ARAM balance data')
      const { data } = await this._api.getAramBalance({ signal })

      if (signal.aborted) {
        return
      }

      const { data: balance } = parseOpggAramBalance(data)
      state.setAramBalance(balance)
      logger.info(`OP.GG: updated ARAM balance data (${balance.length} items)`)
    } catch (error) {
      if (!signal.aborted) {
        logger.warn('OP.GG: failed to update ARAM balance data', error)
      }
    } finally {
      if (!signal.aborted) {
        this._refreshTask.start({ delay: OPGG_ARAM_BALANCE_UPDATE_INTERVAL })
      }
    }
  }
}
