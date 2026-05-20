import type { AxiosInstance } from 'axios'

import type { AppCommonMain } from '../app-common'
import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { RemoteConfigMain } from '../remote-config'
import type { SelfUpdateSettings, SelfUpdateState } from './state'

export const SELF_UPDATE_MAIN_NAMESPACE = 'self-update-main'

export const DOWNLOAD_DIR_NAME = 'NewUpdates'
export const UPDATE_EXECUTABLE_NAME = 'akari-updater.exe'
export const NEW_VERSION_FLAG = 'NEW_VERSION_FLAG'
export const EXECUTABLE_NAME = 'LeagueAkari.exe'
export const UPDATE_PROGRESS_UPDATE_INTERVAL = 200
export const PLATFORM_UNSUPPORTED_REASON = 'platform-unsupported'

export interface SelfUpdateMainContext {
  namespace: string
  settings: SelfUpdateSettings
  state: SelfUpdateState
  logger: AkariLogger
  appCommon: AppCommonMain
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  remoteConfig: RemoteConfigMain
  httpClient: AxiosInstance
}

export type SelfUpdateActionResult =
  | { result: 'ok' }
  | { result: 'no-op' }
  | { result: 'failed'; reason: string }
