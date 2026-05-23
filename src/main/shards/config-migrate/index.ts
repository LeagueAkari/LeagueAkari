import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { LoggerFactoryMain } from '../logger-factory'
import { StorageMain } from '../storage'
import {
  CONFIG_MIGRATE_MAIN_NAMESPACE,
  CONFIG_MIGRATE_MAIN_PRIORITY,
  type ConfigMigrateMainContext
} from './context'
import { runConfigMigrations } from './migration-runner'

export { sanitizeShortcutSettingRecord } from './migrations/from-1-4-3'

/**
 * 将旧的设置项重新设置, 并设置数据
 */
@Shard(ConfigMigrateMain.id, CONFIG_MIGRATE_MAIN_PRIORITY)
export class ConfigMigrateMain implements IAkariShardInitDispose {
  static id = CONFIG_MIGRATE_MAIN_NAMESPACE

  /**
   * 设置较高优先级, 以优先加载
   */

  private readonly _context: ConfigMigrateMainContext

  constructor(
    storage: StorageMain,
    readonly _loggerFactory: LoggerFactoryMain
  ) {
    this._context = {
      storage,
      logger: _loggerFactory.create(ConfigMigrateMain.id)
    }
  }

  async onInit() {
    await runConfigMigrations(this._context)
  }
}
