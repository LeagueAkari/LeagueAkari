import { TimeoutTask } from '@main/utils/timer'
import { parseOpggAramBalance } from '@shared/data-adapter/opgg'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'

import type { AkariLogger } from '../../logger-factory'
import { OPGG_ARAM_BALANCE_UPDATE_INTERVAL } from '../context'
import type { ExtraAssetsStateOpgg } from '../state'

export class OpggAramBalanceLoader {
  private readonly _refreshTask = new TimeoutTask(() => {
    void this._load()
  })
  private readonly _abortController = new AbortController()

  constructor(
    private readonly _state: ExtraAssetsStateOpgg,
    private readonly _logger: AkariLogger,
    private readonly _api: Pick<OpggHttpApiAxiosHelper, 'getAramBalance'>
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

    try {
      this._logger.info('OP.GG: updating ARAM balance data')
      const { data } = await this._api.getAramBalance({ signal })

      if (signal.aborted) {
        return
      }

      const { data: balance } = parseOpggAramBalance(data)
      this._state.setAramBalance(balance)
      this._logger.info(`OP.GG: updated ARAM balance data (${balance.length} items)`)
    } catch (error) {
      if (!signal.aborted) {
        this._logger.warn('OP.GG: failed to update ARAM balance data', error)
      }
    } finally {
      if (!signal.aborted) {
        this._refreshTask.start({ delay: OPGG_ARAM_BALANCE_UPDATE_INTERVAL })
      }
    }
  }
}
