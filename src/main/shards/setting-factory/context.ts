import type { SharedGlobalShard } from '@shared/akari-shard'

import type { AkariIpcMain } from '../ipc'
import type { StorageMain } from '../storage'

export const SETTING_FACTORY_MAIN_NAMESPACE = 'setting-factory-main'

export interface SettingFactoryMainContext {
  namespace: string
  ipc: AkariIpcMain
  storage: StorageMain
  shared: SharedGlobalShard
}
