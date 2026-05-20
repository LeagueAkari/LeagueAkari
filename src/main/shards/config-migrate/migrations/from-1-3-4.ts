import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration, moveSetting } from './context'

export const MIGRATION_FROM_134 = 'akari-migration-from-1.3.4_patch1'

export async function migrateFrom134({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_134)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_134)

  await manager.save(Setting, Setting.create('app-common-main/showFreeSoftwareDeclaration', true))

  await moveSetting(
    manager,
    'window-manager-main/auxWindowPinned',
    'window-manager-main/aux-window/pinned'
  )
  await moveSetting(
    manager,
    'window-manager-main/auxWindowOpacity',
    'window-manager-main/aux-window/opacity'
  )
  await moveSetting(
    manager,
    'window-manager-main/auxWindowEnabled',
    'window-manager-main/aux-window/enabled'
  )
  await moveSetting(
    manager,
    'window-manager-main/auxWindowAutoShow',
    'window-manager-main/aux-window/autoShow'
  )
  await moveSetting(
    manager,
    'window-manager-main/auxWindowShowSkinSelector',
    'window-manager-main/aux-window/showSkinSelector'
  )

  await moveSetting(
    manager,
    'window-manager-main/mainWindowSize',
    'window-manager-main/main-window/size'
  )

  const httpProxySetting = await manager.findOneBy(Setting, {
    key: Equal('app-common-main/httpProxy')
  })

  if (httpProxySetting) {
    await manager.save(
      Setting.create('app-common-main/httpProxy', {
        strategy: httpProxySetting.value.enabled ? 'force' : 'auto',
        port: httpProxySetting.value.port,
        host: httpProxySetting.value.host
      })
    )
  }

  const boundsRecord = await manager.findOneBy(Setting, {
    key: Equal('window-manager-main/auxWindowFunctionalityBounds')
  })

  if (boundsRecord) {
    const indicator = boundsRecord.value.indicator
    const opgg = boundsRecord.value.opgg

    if (indicator) {
      await manager.save(Setting.create('window-manager-main/aux-window/bounds', indicator))
    }

    if (opgg) {
      await manager.save(Setting.create('window-manager-main/opgg-window/bounds', opgg))
    }
  }

  await markMigration(manager, MIGRATION_FROM_134)
  logger.info(`Migration completed, to ${MIGRATION_FROM_134}`)
}
