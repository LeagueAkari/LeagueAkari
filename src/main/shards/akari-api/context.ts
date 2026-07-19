import type { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'

import type { AppCommonMain } from '../app-common'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AkariApiState } from './state'

export const AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL = 2 * 60 * 60 * 1000
export const AKARI_API_NOTICE_UPDATE_INTERVAL = 60 * 60 * 1000

export interface AkariApiMainContext {
  state: AkariApiState
  logger: AkariLogger
  settingService: SetterSettingService
  mobxUtils: MobxUtilsMain
  appCommon: AppCommonMain
  api: AkariApiHttpApiAxiosHelper
}
