import { app } from 'electron'

import type { StatisticsMainContext } from './context'

export class VersionUsageRecorder {
  constructor(private readonly context: StatisticsMainContext) {}

  /**
   * 统计 LeagueAkari 的版本使用量
   * @returns
   */
  async recordOnce() {
    const { akariApi, logger, settingService } = this.context

    try {
      const version = app.getVersion()
      let countedVersions = await settingService._getFromStorage('alreadyCounted')

      if (!Array.isArray(countedVersions)) {
        countedVersions = null
      }

      if (countedVersions) {
        if (countedVersions.includes(version)) {
          return
        }

        const { data } = await akariApi.postStatisticsRecord(version)
        await settingService._saveToStorage('alreadyCounted', [...countedVersions, version])
        logger.info('Counter increment success', data)
      } else {
        const { data: aka } = await akariApi.postStatisticsRecord('v0.0.0')
        const { data: ri } = await akariApi.postStatisticsRecord(version)
        await settingService._saveToStorage('alreadyCounted', [version])
        logger.info('Counter increment success', aka, ri)
      }
    } catch (error) {
      logger.error('Counter increment failed', error)
    }
  }
}
