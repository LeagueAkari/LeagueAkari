import type { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'

import type { AppCommonMain } from '../app-common'
import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { RemoteGitRepository } from './repository'
import type { RemoteConfigSettings, RemoteConfigState } from './state'

export const REMOTE_CONFIG_MAIN_NAMESPACE = 'remote-config-main'

export const REMOTE_CONFIG_SUPPORTED_QUEUES_RELATIVE_PATH = 'sgp/supported-queues.json'
export const REMOTE_CONFIG_LEAGUE_SERVERS_RELATIVE_PATH = 'sgp/league-servers.json'
export const REMOTE_CONFIG_ONGOING_GAME_CONFIG_RELATIVE_PATH = 'ongoing-game/config.json'
export const REMOTE_CONFIG_AUTO_SELECT_GROUPS_RELATIVE_PATH = 'auto-select/groups.json'

export const REMOTE_CONFIG_CACHED_RESOURCE_UPDATE_INTERVAL = 2 * 60 * 60 * 1000
export const REMOTE_CONFIG_VOLATILE_RESOURCE_UPDATE_INTERVAL = 4 * 60 * 60 * 1000

export interface RemoteConfigMainContext {
  namespace: string
  state: RemoteConfigState
  settings: RemoteConfigSettings
  logger: AkariLogger
  settingService: SetterSettingService
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
  appCommon: AppCommonMain
  repository: RemoteGitRepository
  akariApi: AkariApiHttpApiAxiosHelper
}
