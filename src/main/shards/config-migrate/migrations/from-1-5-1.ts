import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { type MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_151 = 'akari-migration-from-1.5.1'
export const LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY = 'window-manager-main/aux-window/showSkinSelector'
export const OPGG_SHOW_SKIN_SELECTOR_KEY = 'window-manager-main/opgg-window/showSkinSelector'
export const BACKGROUND_MATERIAL_SETTING_KEY = 'window-manager-main/backgroundMaterial'

async function migrateSkinSelectorSetting({ manager }: MigrationContext) {
  const target = await manager.findOneBy(Setting, { key: Equal(OPGG_SHOW_SKIN_SELECTOR_KEY) })
  if (target) return

  const legacy = await manager.findOneBy(Setting, {
    key: Equal(LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY)
  })
  if (!legacy || typeof legacy.value !== 'boolean') return

  await manager.save(Setting.create(OPGG_SHOW_SKIN_SELECTOR_KEY, legacy.value))
}

async function migrateBackgroundMaterialSetting({ manager }: MigrationContext) {
  const saved = await manager.findOneBy(Setting, {
    key: Equal(BACKGROUND_MATERIAL_SETTING_KEY)
  })
  if (!saved) return

  const migratedValue = saved.value === 'mica' ? 'system' : saved.value
  if (migratedValue === saved.value) return

  await manager.save(Setting.create(BACKGROUND_MATERIAL_SETTING_KEY, migratedValue))
}

async function migrateNetworkProxySettings({ manager }: MigrationContext) {
  const legacy = await manager.findOneBy(Setting, { key: 'app-common-main/httpProxy' })
  if (legacy) {
    const current = await manager.findOneBy(Setting, { key: 'network-main/httpProxy' })
    if (!current) {
      const strategies = { disable: 'direct', auto: 'system', force: 'fixed-servers' }
      await manager.save(
        Setting.create('network-main/httpProxy', {
          ...legacy.value,
          strategy: strategies[legacy.value.strategy as keyof typeof strategies]
        })
      )
    }
    await manager.remove(legacy)
  }
}

export async function migrateFrom151(context: MigrationContext) {
  if (await hasMigration(context.manager, MIGRATION_FROM_151)) return
  context.logger.info('Start migrating settings', MIGRATION_FROM_151)
  await migrateSkinSelectorSetting(context)
  await migrateBackgroundMaterialSetting(context)
  await migrateNetworkProxySettings(context)
  await markMigration(context.manager, MIGRATION_FROM_151)
  context.logger.info(`Migration completed, to ${MIGRATION_FROM_151}`)
}

export const MIGRATION_CHAMPION_DATA_WINDOW = 'akari-migration-from-1.5.1-champion-data-window'

// Only stable window preferences belong here. Do not migrate champion configuration or
// source preferences while their contracts are still being designed.
const WINDOW_SETTING_KEYS = [
  'trackedBounds',
  'enabled',
  'autoShow',
  'opacity',
  'pinned',
  'showShortcut',
  'showSkinSelector'
] as const

export async function migrateChampionDataWindow(context: MigrationContext) {
  const { manager, logger } = context
  if (await hasMigration(manager, MIGRATION_CHAMPION_DATA_WINDOW)) return

  logger.info('Start migrating settings', MIGRATION_CHAMPION_DATA_WINDOW)
  for (const key of WINDOW_SETTING_KEYS) {
    const legacy = await manager.findOneBy(Setting, {
      key: Equal(`window-manager-main/opgg-window/${key}`)
    })
    if (!legacy) continue

    const targetKey = `window-manager-main/champion-data-window/${key}`
    const current = await manager.findOneBy(Setting, { key: Equal(targetKey) })
    if (!current) {
      await manager.save(Setting.create(targetKey, legacy.value))
    }
    await manager.remove(legacy)
  }

  await markMigration(manager, MIGRATION_CHAMPION_DATA_WINDOW)
  logger.info(`Migration completed, to ${MIGRATION_CHAMPION_DATA_WINDOW}`)
}
