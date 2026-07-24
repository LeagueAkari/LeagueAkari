import {
  DEFAULT_ONGOING_GAME_PANEL_PLAYER_CARD_TAG_SETTINGS,
  type OngoingGamePanelPlayerCardTagSettings
} from '@shared/shards/ongoing-game/settings'
import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_150 = 'akari-migration-from-1.5.0_patch1'
export const PLAYER_CARD_TAGS_SETTING_KEY = 'ongoing-game-main/playerCardTags'

const PLAYER_CARD_TAG_SETTING_KEYS = Object.keys(
  DEFAULT_ONGOING_GAME_PANEL_PLAYER_CARD_TAG_SETTINGS
) as Array<keyof OngoingGamePanelPlayerCardTagSettings>
const PLAYER_CARD_TAG_SETTING_KEY_SET = new Set<string>(PLAYER_CARD_TAG_SETTING_KEYS)
const PLAYER_CARD_TAG_NON_SETTING_KEYS = new Set([
  'key',
  'value',
  'showSoloDeathsTag',
  '__proto__',
  'prototype',
  'constructor'
])

type UnknownRecord = Record<string, unknown>
type ExtensiblePlayerCardTagSettings = OngoingGamePanelPlayerCardTagSettings & UnknownRecord

function isUnknownRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function applyPlayerCardTagSettings(
  target: ExtensiblePlayerCardTagSettings,
  source: UnknownRecord
) {
  if (
    typeof source.showSoloDeathsTag === 'boolean' &&
    typeof source.showEasyGankTag !== 'boolean'
  ) {
    target.showEasyGankTag = source.showSoloDeathsTag
  }

  for (const key of PLAYER_CARD_TAG_SETTING_KEYS) {
    const value = source[key]
    if (typeof value === 'boolean') {
      target[key] = value
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (PLAYER_CARD_TAG_SETTING_KEY_SET.has(key) || PLAYER_CARD_TAG_NON_SETTING_KEYS.has(key)) {
      continue
    }

    target[key] = value
  }
}

/**
 * 1.5.0 的迁移错误地展开了 Setting 实体，而不是实体中的 value。
 *
 * 用户在升级后仍可能修改外层的开关，因此先恢复内层原值，再让外层已修改的开关覆盖它。
 */
export function repairPlayerCardTagsSetting(value: unknown): OngoingGamePanelPlayerCardTagSettings {
  const repaired: ExtensiblePlayerCardTagSettings = {
    ...DEFAULT_ONGOING_GAME_PANEL_PLAYER_CARD_TAG_SETTINGS
  }

  if (!isUnknownRecord(value)) {
    return repaired
  }

  if (isUnknownRecord(value.value)) {
    applyPlayerCardTagSettings(repaired, value.value)
  }

  applyPlayerCardTagSettings(repaired, value)
  return repaired
}

async function migrateOngoingGameSettingsFrom150({ manager }: MigrationContext) {
  const saved = await manager.findOneBy(Setting, { key: Equal(PLAYER_CARD_TAGS_SETTING_KEY) })

  if (!saved) {
    return
  }

  await manager.save(
    Setting.create(PLAYER_CARD_TAGS_SETTING_KEY, repairPlayerCardTagsSetting(saved.value))
  )
}

export async function migrateFrom150(context: MigrationContext) {
  if (await hasMigration(context.manager, MIGRATION_FROM_150)) {
    return
  }

  context.logger.info('Start migrating settings', MIGRATION_FROM_150)

  await migrateOngoingGameSettingsFrom150(context)
  await markMigration(context.manager, MIGRATION_FROM_150)

  context.logger.info(`Migration completed, to ${MIGRATION_FROM_150}`)
}
