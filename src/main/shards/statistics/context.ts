import type { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'

import type { AkariLogger } from '../logger-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'

export const STATISTICS_MAIN_NAMESPACE = 'statistics-main'

export interface StatisticsMainContext {
  namespace: string
  akariApi: AkariApiHttpApiAxiosHelper
  logger: AkariLogger
  settingService: SetterSettingService
}
