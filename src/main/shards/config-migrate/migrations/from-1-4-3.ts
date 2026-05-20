import { isSupportedShortcutId } from '@shared/utils/keyboard-shortcuts'
import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_143 = 'akari-migration-from-1.4.3_patch1'

const SCALAR_SHORTCUT_SETTING_KEYS = new Set([
  'game-client-main/terminateShortcut',
  'in-game-send-main/cancelShortcut',
  'window-manager-main/opgg-window/showShortcut',
  'window-manager-main/ongoing-game-window/showShortcut',
  'window-manager-main/cd-timer-window/showShortcut'
])

const SENDABLE_ITEMS_SETTING_KEY = 'in-game-send-main/sendableItems'

const SENDABLE_ITEM_SHORTCUT_FIELDS = [
  'sendAllShortcut',
  'sendAllyShortcut',
  'sendEnemyShortcut'
] as const

export function sanitizeShortcutSettingRecord(record: Pick<Setting, 'key' | 'value'>) {
  if (SCALAR_SHORTCUT_SETTING_KEYS.has(record.key)) {
    if (typeof record.value === 'string' && !isSupportedShortcutId(record.value)) {
      return { changed: true, value: null }
    }

    return { changed: false, value: record.value }
  }

  if (record.key !== SENDABLE_ITEMS_SETTING_KEY || !Array.isArray(record.value)) {
    return { changed: false, value: record.value }
  }

  let changed = false
  const value = record.value.map((item) => {
    if (!item || typeof item !== 'object') {
      return item
    }

    let nextItem = item
    for (const field of SENDABLE_ITEM_SHORTCUT_FIELDS) {
      if (typeof item[field] === 'string' && !isSupportedShortcutId(item[field])) {
        if (nextItem === item) {
          nextItem = { ...item }
        }

        nextItem[field] = null
        changed = true
      }
    }

    return nextItem
  })

  return { changed, value: changed ? value : record.value }
}

export async function migrateFrom143({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_143)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_143)

  for (const key of [...SCALAR_SHORTCUT_SETTING_KEYS, SENDABLE_ITEMS_SETTING_KEY]) {
    const setting = await manager.findOneBy(Setting, { key: Equal(key) })
    if (!setting) {
      continue
    }

    const sanitized = sanitizeShortcutSettingRecord(setting)
    if (sanitized.changed) {
      await manager.save(Setting.create(key, sanitized.value))
    }
  }

  await markMigration(manager, MIGRATION_FROM_143)
  logger.info(`Migration completed, to ${MIGRATION_FROM_143}`)
}
