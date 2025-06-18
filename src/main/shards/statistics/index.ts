import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
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

  private _http = axios.create({
    baseURL: 'https://akari-api.hanxven.cc',
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()}`,
      'X-Akari-Version': app.getVersion()
    }
  })

  private _log: AkariLogger
  private _setting: SetterSettingService

  constructor(_loggerFactory: LoggerFactoryMain, _settingFactory: SettingFactoryMain) {
    this._log = _loggerFactory.create(StatisticsMain.id)
    this._setting = _settingFactory.register(StatisticsMain.id, {}, {})
  }

  /**
   * 统计 LeagueAkari 的版本使用量
   * @returns
   */
  private async _recordVersionUsageOnce() {
    try {
      const version = app.getVersion()
      let countedVersions = await this._setting._getFromStorage('alreadyCounted')

      if (!Array.isArray(countedVersions)) {
        countedVersions = null
      }

      if (countedVersions) {
        if (countedVersions.includes(version)) {
          return
        }

        const { data } = await this._http.post('/statistics/v1/records', { version })
        await this._setting._saveToStorage('alreadyCounted', [...countedVersions, version])
        this._log.info('Counter increment success', data)
      } else {
        const { data: aka } = await this._http.post('/statistics/v1/records', { version: 'v0.0.0' })
        const { data: ri } = await this._http.post('/statistics/v1/records', { version })
        await this._setting._saveToStorage('alreadyCounted', [version])
        this._log.info('Counter increment success', aka, ri)
      }
    } catch (error) {
      this._log.error('Counter increment failed', error)
    }
  }

  async onInit() {
    this._recordVersionUsageOnce().catch((e) => {
      // normally it should not happen
      this._log.error('Oops... Something went wrong when counting visitors', e)
    })
  }
}
