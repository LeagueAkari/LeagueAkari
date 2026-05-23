import type { AkariLogger } from '../logger-factory'
import type { StorageMain } from '../storage'

export const CONFIG_MIGRATE_MAIN_NAMESPACE = 'config-migrate-main'
export const CONFIG_MIGRATE_MAIN_PRIORITY = 2992

export interface ConfigMigrateMainContext {
  storage: StorageMain
  logger: AkariLogger
}
