import type { ConfigMigrateMainContext } from './context'
import { migrateFrom126 } from './migrations/from-1-2-6'
import { migrateFrom134 } from './migrations/from-1-3-4'
import { migrateFrom135 } from './migrations/from-1-3-5'
import { migrateFrom140 } from './migrations/from-1-4-0'
import { migrateFrom141 } from './migrations/from-1-4-1'
import { migrateFrom143 } from './migrations/from-1-4-3'

const MIGRATIONS = [
  migrateFrom126,
  migrateFrom134,
  migrateFrom135,
  migrateFrom140,
  migrateFrom141,
  migrateFrom143
]

export async function runConfigMigrations(context: ConfigMigrateMainContext) {
  try {
    await context.storage.dataSource.transaction(async (manager) => {
      for (const migrate of MIGRATIONS) {
        await migrate({ manager, logger: context.logger })
      }
    })
  } catch (error) {
    context.logger.error('Failed to migrate settings', error)
  }
}
