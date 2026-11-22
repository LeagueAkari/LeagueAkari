import { createChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import type { OpggChampionDataPreferences } from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import { Like } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { type MigrationContext, hasMigration, markMigration } from './context'

export const MIGRATION_FROM_151 = 'akari-migration-from-1.5.1'
export const BACKGROUND_MATERIAL_SETTING_KEY = 'window-manager-main/backgroundMaterial'

const OLD_AUX_WINDOW = 'window-manager-main/aux-window'
const OLD_OPGG_WINDOW = 'window-manager-main/opgg-window'
const SECONDARY_WINDOW = 'window-manager-main/secondary-window'

// The preferences written by the v1.5.1 renderer. Non-lane modes also saved "none".
interface OpggPreferences151 extends Omit<OpggChampionDataPreferences, 'position'> {
  position: OpggChampionDataPreferences['position'] | 'none'
  flashPosition: OpggFlashPosition
}

async function migrateSecondaryWindow({ manager }: MigrationContext) {
  const records = await manager.findBy(Setting, [
    { key: Like(`${OLD_AUX_WINDOW}/%`) },
    { key: Like(`${OLD_OPGG_WINDOW}/%`) }
  ])

  if (!records.length) {
    return
  }

  const saved = new Map(records.map((record) => [record.key, record.value]))
  const auxEnabled = saved.get(`${OLD_AUX_WINDOW}/enabled`) ?? true
  const opggEnabled = saved.get(`${OLD_OPGG_WINDOW}/enabled`) ?? true

  const settings = {
    enabled: auxEnabled || opggEnabled,
    autoShowInLobby: auxEnabled && (saved.get(`${OLD_AUX_WINDOW}/autoShow`) ?? true),
    autoShowInChampSelect: opggEnabled && (saved.get(`${OLD_OPGG_WINDOW}/autoShow`) ?? true),
    showSkinSelector: saved.get(`${OLD_AUX_WINDOW}/showSkinSelector`) ?? false
  }

  for (const [key, value] of Object.entries(settings)) {
    await manager.save(Setting.create(`${SECONDARY_WINDOW}/${key}`, value))
  }

  for (const key of ['trackedBounds', 'opacity', 'pinned', 'showShortcut']) {
    const value = saved.get(`${OLD_OPGG_WINDOW}/${key}`)

    if (value !== undefined) {
      await manager.save(Setting.create(`${SECONDARY_WINDOW}/${key}`, value))
    }
  }

  await manager.remove(records)
}

async function migrateChampionDataSettings({ manager }: MigrationContext) {
  const records = await manager.findBy(Setting, { key: Like('opgg-renderer/%') })

  if (!records.length) {
    return
  }

  const saved = new Map(records.map((record) => [record.key, record.value]))
  const preferences = saved.get('opgg-renderer/savedPreferences') as OpggPreferences151 | undefined

  if (preferences) {
    const { flashPosition, position, ...query } = preferences

    await manager.save(Setting.create('champion-data-main/opggFlashPosition', flashPosition))
    await manager.save(
      Setting.create('champion-data-main/opggPreferences', {
        ...query,
        position: position === 'none' ? 'top' : position
      } satisfies OpggChampionDataPreferences)
    )
  }

  const autoApplyRunes = saved.get('opgg-renderer/autoApplyRunes')

  if (autoApplyRunes !== undefined) {
    const automation = createChampionDataAutomationSettings()
    automation.enabled = autoApplyRunes

    if (preferences) {
      automation.opgg = { region: preferences.region, tier: preferences.tier }
    }

    await manager.save(Setting.create('champion-data-main/automation', automation))
  }

  // Automatic spells and item sets are retired; manual application remains available.
  await manager.remove(records)
}

async function migrateBackgroundMaterialSetting({ manager }: MigrationContext) {
  const saved = await manager.findOneBy(Setting, { key: BACKGROUND_MATERIAL_SETTING_KEY })

  if (saved?.value === 'mica') {
    await manager.save(Setting.create(BACKGROUND_MATERIAL_SETTING_KEY, 'system'))
  }
}

async function migrateNetworkProxySettings({ manager }: MigrationContext) {
  const legacy = await manager.findOneBy(Setting, { key: 'app-common-main/httpProxy' })

  if (!legacy) {
    return
  }

  const strategies = { disable: 'direct', auto: 'system', force: 'fixed-servers' }

  await manager.save(
    Setting.create('network-main/httpProxy', {
      ...legacy.value,
      strategy: strategies[legacy.value.strategy as keyof typeof strategies]
    })
  )

  await manager.remove(legacy)
}

export async function migrateFrom151(context: MigrationContext) {
  if (await hasMigration(context.manager, MIGRATION_FROM_151)) {
    return
  }

  context.logger.info('Start migrating settings', MIGRATION_FROM_151)

  await migrateSecondaryWindow(context)
  await migrateChampionDataSettings(context)
  await migrateBackgroundMaterialSetting(context)
  await migrateNetworkProxySettings(context)

  await markMigration(context.manager, MIGRATION_FROM_151)

  context.logger.info(`Migration completed, to ${MIGRATION_FROM_151}`)
}
