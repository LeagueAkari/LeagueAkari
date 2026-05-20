import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration, moveSetting } from './context'

export const MIGRATION_FROM_135 = 'akari-migration-from-1.3.5_patch1'

export async function migrateFrom135({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_135)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_135)

  await manager.save(Setting.create('app-common-main/showFreeSoftwareDeclaration', true))

  await moveSetting(manager, 'app-common-renderer/streamerMode', 'app-common-main/streamerMode')
  await moveSetting(
    manager,
    'app-common-renderer/streamerModeUseAkariStyledName',
    'app-common-main/streamerModeUseAkariStyledName'
  )

  await markMigration(manager, MIGRATION_FROM_135)

  const oldPlaintextSend = await manager.findOneBy(Setting, {
    key: Equal('in-game-send-main/customSend')
  })

  if (oldPlaintextSend) {
    try {
      const old = oldPlaintextSend.value
      const current = await manager.findOneBy(Setting, {
        key: Equal('in-game-send-main/sendableItems')
      })

      const newArr = current ? current.value : []

      await manager.save(
        Setting.create('in-game-send-main/sendableItems', [
          ...newArr,
          ...old.map((item: any) => ({
            id: item.id,
            name: item.name,
            content: {
              type: 'plaintext',
              content: item.message
            }
          }))
        ])
      )
    } catch (error) {
      logger.error('Failed to migrate former sendable items', error)
    }
  }

  await moveSetting(
    manager,
    'self-update-main/downloadSource',
    'remote-config-main/preferredSource'
  )
}
