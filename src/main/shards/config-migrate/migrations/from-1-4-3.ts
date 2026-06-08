import { isSupportedShortcutId } from '@shared/utils/keyboard-shortcuts'
import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_143 = 'akari-migration-from-1.4.3_patch1'
export const MIGRATION_FROM_143_AUTO_MISC = 'akari-migration-from-1.4.3_patch2'

const AUTO_MISC_SETTING_MIGRATION_TARGETS: Record<string, string> = {
  'auto-reply-main/enabled': 'auto-misc-main/autoReplyEnabled',
  'auto-reply-main/enableOnAway': 'auto-misc-main/autoReplyEnableOnAway',
  'auto-reply-main/text': 'auto-misc-main/autoReplyText',
  'auto-reply-main/lockOfflineStatus': 'auto-misc-main/lockOfflineStatus'
}

const SCALAR_SHORTCUT_SETTING_KEYS = new Set([
  'game-client-main/terminateShortcut',
  'in-game-send-main/cancelShortcut',
  'window-manager-main/opgg-window/showShortcut',
  'window-manager-main/ongoing-game-window/showShortcut',
  'window-manager-main/cd-timer-window/showShortcut'
])

const IN_GAME_SEND_RESET_SETTING_KEYS = new Set([
  'in-game-send-main/sendableItems',
  'in-game-send-main/templates',
  'in-game-send-main/autoTemplateBootstrap'
])

export function getAutoMiscSettingMigrationTarget(key: string) {
  return AUTO_MISC_SETTING_MIGRATION_TARGETS[key] ?? null
}

export function shouldResetInGameSendSetting(key: string) {
  return IN_GAME_SEND_RESET_SETTING_KEYS.has(key)
}

export function sanitizeShortcutSettingRecord(record: Pick<Setting, 'key' | 'value'>) {
  if (SCALAR_SHORTCUT_SETTING_KEYS.has(record.key)) {
    if (typeof record.value === 'string' && !isSupportedShortcutId(record.value)) {
      return { changed: true, value: null }
    }

    return { changed: false, value: record.value }
  }

  return { changed: false, value: record.value }
}

async function migrateAutoMiscSettings(manager: MigrationContext['manager']) {
  for (const [from, to] of Object.entries(AUTO_MISC_SETTING_MIGRATION_TARGETS)) {
    const setting = await manager.findOneBy(Setting, { key: Equal(from) })
    if (!setting) {
      continue
    }

    const target = await manager.findOneBy(Setting, { key: Equal(to) })
    if (!target) {
      await manager.save(Setting.create(to, setting.value))
    }

    await manager.remove(setting)
  }
}

async function resetInGameSendSettings(manager: MigrationContext['manager']) {
  for (const key of IN_GAME_SEND_RESET_SETTING_KEYS) {
    const setting = await manager.findOneBy(Setting, { key: Equal(key) })
    if (setting) {
      await manager.remove(setting)
    }
  }
}

async function migrateShortcutSettingsFrom143({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_143)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_143)

  for (const key of SCALAR_SHORTCUT_SETTING_KEYS) {
    const setting = await manager.findOneBy(Setting, { key: Equal(key) })
    if (!setting) {
      continue
    }

    const sanitized = sanitizeShortcutSettingRecord(setting)
    if (sanitized.changed) {
      await manager.save(Setting.create(key, sanitized.value))
    }
  }

  await resetInGameSendSettings(manager)

  await markMigration(manager, MIGRATION_FROM_143)
  logger.info(`Migration completed, to ${MIGRATION_FROM_143}`)
}

async function migrateAutoMiscSettingsFrom143({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_143_AUTO_MISC)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_143_AUTO_MISC)

  await migrateAutoMiscSettings(manager)

  await markMigration(manager, MIGRATION_FROM_143_AUTO_MISC)
  logger.info(`Migration completed, to ${MIGRATION_FROM_143_AUTO_MISC}`)
}

export async function migrateFrom143(context: MigrationContext) {
  await migrateShortcutSettingsFrom143(context)
  await migrateAutoMiscSettingsFrom143(context)
}
