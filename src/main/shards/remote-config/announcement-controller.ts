import { IntervalTask } from '@main/utils/timer'
import { comparer } from 'mobx'

import {
  REMOTE_CONFIG_VOLATILE_RESOURCE_UPDATE_INTERVAL,
  type RemoteConfigMainContext
} from './context'
import { hasReachedRemoteRateLimit } from './rate-limit'

export class RemoteConfigAnnouncementController {
  private readonly _announcementTask = new IntervalTask(this._updateFromRemote.bind(this), {
    interval: REMOTE_CONFIG_VOLATILE_RESOURCE_UPDATE_INTERVAL
  })

  constructor(private readonly _context: RemoteConfigMainContext) {}

  watch() {
    const { appCommon, mobxUtils, settings } = this._context

    // 语言和源切换时需要重新获取公告。
    mobxUtils.reaction(
      () => ({
        source: settings.preferredSource,
        locale: appCommon.settings.locale
      }),
      () => {
        this._announcementTask.start({ runImmediately: true })
      },
      { fireImmediately: true, equals: comparer.shallow }
    )
  }

  private async _updateFromRemote() {
    const { appCommon, logger, repository, settings, state } = this._context

    if (state.isUpdatingAnnouncement) {
      return
    }

    state.setUpdatingAnnouncement(true)

    try {
      const locale = appCommon.settings.locale as 'zh-CN' | 'en'
      const content = await repository.getAnnouncement({
        source: settings.preferredSource,
        repo: 'akari-config',
        branch: 'main',
        locale
      })
      state.setAnnouncement(content)
      logger.info('Updated Announcement', settings.preferredSource)
    } catch (error) {
      if (hasReachedRemoteRateLimit(error, logger)) {
        return
      }

      logger.warn('Update Announcement failed', error)
    } finally {
      state.setUpdatingAnnouncement(false)
    }
  }
}
