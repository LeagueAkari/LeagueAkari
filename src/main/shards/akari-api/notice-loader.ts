import { IntervalTask } from '@main/utils/timer'
import { type AkariApiLanguage, AkariNoticeSchema } from '@shared/shards/akari-api'

import { AKARI_API_VOLATILE_RESOURCE_UPDATE_INTERVAL, type AkariApiMainContext } from './context'

export class AkariApiNoticeLoader {
  private readonly _task = new IntervalTask(this._update.bind(this), {
    interval: AKARI_API_VOLATILE_RESOURCE_UPDATE_INTERVAL
  })

  constructor(private readonly _context: AkariApiMainContext) {}

  watch() {
    const { appCommon, mobxUtils } = this._context

    mobxUtils.reaction(
      () => appCommon.settings.locale,
      () => this._task.start({ runImmediately: true }),
      { fireImmediately: true }
    )
  }

  dispose() {
    this._task.cancel()
  }

  private async _update() {
    const { api, appCommon, logger, state } = this._context

    if (state.isUpdatingNotice) {
      return
    }

    state.setUpdatingNotice(true)

    try {
      const response = await api.getLatestNotice(appCommon.settings.locale as AkariApiLanguage)
      state.setNotice(AkariNoticeSchema.parse(response.data))
      logger.info('Updated notice')
    } catch (error) {
      logger.warn('Update notice failed', error)
    } finally {
      state.setUpdatingNotice(false)
    }
  }
}
