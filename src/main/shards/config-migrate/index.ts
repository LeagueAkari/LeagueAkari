import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { StorageMain } from '../storage'
import { migrateFrom126 } from './migrations/from-1-2-6'
import { migrateFrom134 } from './migrations/from-1-3-4'
import { migrateFrom135 } from './migrations/from-1-3-5'
import { migrateFrom140 } from './migrations/from-1-4-0'
import { migrateFrom141 } from './migrations/from-1-4-1'
import { migrateFrom143 } from './migrations/from-1-4-3'

export { sanitizeShortcutSettingRecord } from './migrations/from-1-4-3'

const MIGRATIONS = [
  migrateFrom126,
  migrateFrom134,
  migrateFrom135,
  migrateFrom140,
  migrateFrom141,
  migrateFrom143
]

/**
 * 将旧的设置项重新设置, 并设置数据
 */
@Shard(ConfigMigrateMain.id, 2992)
export class ConfigMigrateMain implements IAkariShardInitDispose {
  static id = 'config-migrate-main'

  /**
   * 设置较高优先级, 以优先加载
   */

  private readonly _log: AkariLogger

  constructor(
    private readonly _st: StorageMain,
    readonly _loggerFactory: LoggerFactoryMain
  ) {
    this._log = _loggerFactory.create(ConfigMigrateMain.id)
  }

  async onInit() {
    try {
      await this._st.dataSource.transaction(async (manager) => {
        for (const migrate of MIGRATIONS) {
          await migrate({ manager, log: this._log })
        }
      })
    } catch (error) {
      this._log.error('Failed to migrate settings', error)
    }
  }
}
