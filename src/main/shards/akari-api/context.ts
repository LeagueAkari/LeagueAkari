import type { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'

import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AkariApiState } from './state'

export const AKARI_API_MAIN_NAMESPACE = 'akari-api-main'
export const AKARI_API_REQUEST_TIMEOUT = 10_000
export const AKARI_API_BOOTSTRAP_CACHE_PATH = 'bootstrap.json'
export const AKARI_API_BOOTSTRAP_NPM_LATEST_URL =
  'https://registry.npmjs.org/@leagueakari%2fbootstrap/latest'

export interface AkariApiMainContext {
  namespace: string
  state: AkariApiState
  ipc: AkariIpcMain
  logger: AkariLogger
  settingService: SetterSettingService
  api: AkariApiHttpApiAxiosHelper
}
