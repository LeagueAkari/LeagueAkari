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
    baseURL: 'https://akari-statistics-worker.hanxven.workers.dev',
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()}`
    }
  })

  private _log: AkariLogger
  private _setting: SetterSettingService

  constructor(_loggerFactory: LoggerFactoryMain, _settingFactory: SettingFactoryMain) {
    this._log = _loggerFactory.create(StatisticsMain.id)
    this._setting = _settingFactory.register(StatisticsMain.id, {}, {})
  }

  private async _counterIncrIfFirstTime() {
    const flag = await this._setting._getFromStorage('alreadyCounted')

    if (flag) {
      return
    }

    try {
      const { data } = await this._http.post('count/league-akari-visitors-test')
      await this._setting._saveToStorage('alreadyCounted', true)
      this._log.info('Counter incr success', data)
    } catch (error) {
      this._log.error('Counter incr failed', error)
    }
  }

  async onInit() {
    this._counterIncrIfFirstTime().catch((e) => {
      // normally it should not happen
      this._log.error('Oops... Something went wrong when counting visitors', e)
    })
  }
}
