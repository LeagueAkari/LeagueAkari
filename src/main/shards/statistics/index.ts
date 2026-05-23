import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import axios from 'axios'
import { app } from 'electron'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { STATISTICS_MAIN_NAMESPACE, type StatisticsMainContext } from './context'
import { VersionUsageRecorder } from './version-usage-recorder'

/**
 * 进行简单的数据统计
 */
@Shard(StatisticsMain.id)
export class StatisticsMain implements IAkariShardInitDispose {
  static readonly id = STATISTICS_MAIN_NAMESPACE

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
  private readonly _context: StatisticsMainContext
  private readonly _versionUsageRecorder: VersionUsageRecorder

  constructor(_loggerFactory: LoggerFactoryMain, _settingFactory: SettingFactoryMain) {
    this._logger = _loggerFactory.create(StatisticsMain.id)
    this._settingService = _settingFactory.register(StatisticsMain.id, {})
    this._context = {
      namespace: StatisticsMain.id,
      akariApi: this._akariApi,
      logger: this._logger,
      settingService: this._settingService
    }
    this._versionUsageRecorder = new VersionUsageRecorder(this._context)
  }

  async onInit() {
    this._versionUsageRecorder.recordOnce().catch((e) => {
      // normally it should not happen
      this._logger.error('Oops... Something went wrong when counting visitors', e)
    })
  }
}
