import { MigrationContext, hasMigration, markMigration, moveSetting } from './context'

export const MIGRATION_FROM_141 = 'akari-migration-from-1.4.1_patch1'

export async function migrateFrom141({ manager, log }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_141)) {
    return
  }

  log.info('Start migrating settings', MIGRATION_FROM_141)

  // Migrate normalBounds to trackedBounds
  await moveSetting(
    manager,
    'window-manager-main/main-window/normalBounds',
    'window-manager-main/main-window/trackedBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/opgg-window/normalBounds',
    'window-manager-main/opgg-window/trackedBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/aux-window/normalBounds',
    'window-manager-main/aux-window/trackedBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/ongoing-game-window/normalBounds',
    'window-manager-main/ongoing-game-window/trackedBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/cd-timer-window/normalBounds',
    'window-manager-main/cd-timer-window/trackedBounds'
  )

  await markMigration(manager, MIGRATION_FROM_141)
  log.info(`Migration completed, to ${MIGRATION_FROM_141}`)
}
