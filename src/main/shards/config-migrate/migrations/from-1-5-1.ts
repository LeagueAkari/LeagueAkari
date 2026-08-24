import type { ChampionDataPreferences } from '@shared/data-adapter/champion-data'
import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { type MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_151 = 'akari-migration-from-1.5.1_champion-data'
export const LEGACY_OPGG_PREFERENCES_KEY = 'opgg-renderer/savedPreferences'
export const CHAMPION_DATA_PREFERENCES_KEY = 'champion-data-main/preferences'

const DEFAULT_PREFERENCES: ChampionDataPreferences = {
  mode: 'ranked',
  position: 'top',
  region: 'global',
  tier: 'all'
}

export function migrateOpggPreferences(value: unknown): ChampionDataPreferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return DEFAULT_PREFERENCES
  }
  const legacy = value as Record<string, unknown>
  const modes = new Set(['ranked', 'aram', 'arena', 'nexus_blitz', 'urf'])
  const positions: Record<string, ChampionDataPreferences['position']> = {
    all: 'all',
    top: 'top',
    jungle: 'jungle',
    mid: 'middle',
    middle: 'middle',
    adc: 'bottom',
    bottom: 'bottom',
    support: 'utility',
    utility: 'utility',
    none: 'none'
  }

  return {
    mode:
      typeof legacy.mode === 'string' && modes.has(legacy.mode)
        ? (legacy.mode as ChampionDataPreferences['mode'])
        : DEFAULT_PREFERENCES.mode,
    position:
      typeof legacy.position === 'string'
        ? (positions[legacy.position] ?? DEFAULT_PREFERENCES.position)
        : DEFAULT_PREFERENCES.position,
    region:
      typeof legacy.region === 'string' && legacy.region
        ? legacy.region
        : DEFAULT_PREFERENCES.region,
    tier:
      typeof legacy.tier === 'string' || typeof legacy.tier === 'number'
        ? legacy.tier
        : DEFAULT_PREFERENCES.tier
  }
}

async function migrateChampionDataPreferences({ manager }: MigrationContext) {
  const target = await manager.findOneBy(Setting, { key: Equal(CHAMPION_DATA_PREFERENCES_KEY) })
  if (target) return
  const legacy = await manager.findOneBy(Setting, { key: Equal(LEGACY_OPGG_PREFERENCES_KEY) })
  if (!legacy) return
  await manager.save(
    Setting.create(CHAMPION_DATA_PREFERENCES_KEY, migrateOpggPreferences(legacy.value))
  )
}

export async function migrateFrom151(context: MigrationContext) {
  if (await hasMigration(context.manager, MIGRATION_FROM_151)) return
  context.logger.info('Start migrating settings', MIGRATION_FROM_151)
  await migrateChampionDataPreferences(context)
  await markMigration(context.manager, MIGRATION_FROM_151)
  context.logger.info(`Migration completed, to ${MIGRATION_FROM_151}`)
}
