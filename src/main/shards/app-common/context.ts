import type { SharedGlobalShard } from '@shared/akari-shard'

import type { AkariProtocolMain } from '../akari-protocol'
import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { AppCommonSettings, AppCommonState } from './state'

export const APP_COMMON_MAIN_NAMESPACE = 'app-common-main'

export interface AppCommonMainContext {
  namespace: string
  shared: SharedGlobalShard
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  protocol: AkariProtocolMain
  logger: AkariLogger
  state: AppCommonState
  settings: AppCommonSettings
}
