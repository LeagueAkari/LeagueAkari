import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import axios from 'axios'
import { app } from 'electron'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'

/**
 * 进行简单的数据统计
 */
@Shard(StatisticsMain.id)
export class StatisticsMain implements IAkariShardInitDispose {
  static readonly id = 'statistics-main'

  private _akariApi = new AkariApiHttpApiAxiosHelper(
    axios.create({
      headers: {
        'User-Agent': `LeagueAkari/${app.getVersion()}`,
        'X-Akari-Version': app.getVersion()
      }
    })
  )

  private _logger: AkariLogger
  private _settingService: SetterSettingService

  constructor(_loggerFactory: LoggerFactoryMain, _settingFactory: SettingFactoryMain) {
    this._logger = _loggerFactory.create(StatisticsMain.id)
    this._settingService = _settingFactory.register(StatisticsMain.id, {})
  }

  /**
   * 统计 LeagueAkari 的版本使用量
   * @returns
   */
  private async _recordVersionUsageOnce() {
    try {
      const version = app.getVersion()
      let countedVersions = await this._settingService._getFromStorage('alreadyCounted')

      if (!Array.isArray(countedVersions)) {
        countedVersions = null
      }

      if (countedVersions) {
        if (countedVersions.includes(version)) {
          return
        }

        const { data } = await this._akariApi.postStatisticsRecord(version)
        await this._settingService._saveToStorage('alreadyCounted', [...countedVersions, version])
        this._logger.info('Counter increment success', data)
      } else {
        const { data: aka } = await this._akariApi.postStatisticsRecord('v0.0.0')
        const { data: ri } = await this._akariApi.postStatisticsRecord(version)
        await this._settingService._saveToStorage('alreadyCounted', [version])
        this._logger.info('Counter increment success', aka, ri)
      }
    } catch (error) {
      this._logger.error('Counter increment failed', error)
    }
  }

  async onInit() {
    this._recordVersionUsageOnce().catch((e) => {
      // normally it should not happen
      this._logger.error('Oops... Something went wrong when counting visitors', e)
    })
  }
}
