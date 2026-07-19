import { IntervalTask } from '@main/utils/timer'
import {
  type AkariApiLanguage,
  AkariContactChannelsSchema,
  AkariNoticeSchema
} from '@shared/shards/akari-api'

import { AKARI_API_NOTICE_UPDATE_INTERVAL, type AkariApiMainContext } from './context'

export class AkariApiNoticeLoader {
  private readonly _task = new IntervalTask(this._update.bind(this), {
    interval: AKARI_API_NOTICE_UPDATE_INTERVAL
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

    if (state.isUpdatingNotice || state.isUpdatingContactChannels) {
      return
    }

    state.setUpdatingNotice(true)
    state.setUpdatingContactChannels(true)

    try {
      const [noticeResult, contactChannelsResult] = await Promise.allSettled([
        api
          .getLatestNotice(appCommon.settings.locale as AkariApiLanguage)
          .then((response) => AkariNoticeSchema.parse(response.data)),
        api.getContactChannels().then((response) => AkariContactChannelsSchema.parse(response.data))
      ])

      if (noticeResult.status === 'fulfilled') {
        state.setNotice(noticeResult.value)
        logger.info('Updated notice')
      } else {
        logger.warn('Update notice failed', noticeResult.reason)
      }

      if (contactChannelsResult.status === 'fulfilled') {
        state.setContactChannels(contactChannelsResult.value)
        logger.info('Updated contact channels')
      } else {
        logger.warn('Update contact channels failed', contactChannelsResult.reason)
      }
    } finally {
      state.setUpdatingNotice(false)
      state.setUpdatingContactChannels(false)
    }
  }
}
