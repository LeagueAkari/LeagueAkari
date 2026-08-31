import 'reflect-metadata'

import { describe, expect, it, vi } from 'vitest'

import { Setting } from '../../storage/entities/Settings'
import {
  BACKGROUND_MATERIAL_SETTING_KEY,
  CHAMPION_DATA_PREFERENCES_KEY,
  LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY,
  MIGRATION_FROM_151,
  OPGG_SHOW_SKIN_SELECTOR_KEY,
  migrateBackgroundMaterialValue,
  migrateFrom151,
  migrateOpggPreferences
} from './from-1-5-1'

describe('from 1.5.1 migration', () => {
  it('uses a new marker so earlier beta migrations run again', () => {
    expect(MIGRATION_FROM_151).toBe('akari-migration-from-1.5.1_patch2')
  })

  it('normalizes only the legacy Mica background material', () => {
    expect(migrateBackgroundMaterialValue('mica')).toBe('system')
    expect(migrateBackgroundMaterialValue('system')).toBe('system')
    expect(migrateBackgroundMaterialValue('none')).toBe('none')
    expect(migrateBackgroundMaterialValue('unexpected')).toBe('unexpected')
  })

  it('converts OP.GG lane names into the shared champion data preferences', () => {
    expect(
      migrateOpggPreferences({
        flashPosition: 'd',
        mode: 'ranked',
        position: 'adc',
        region: 'kr',
        tier: 'emerald_plus'
      })
    ).toEqual({
      mode: 'ranked',
      position: 'bottom',
      region: 'kr',
      tier: 'emerald_plus'
    })
  })

  it('copies valid legacy preferences without deleting the compatibility value', async () => {
    const manager = {
      findOneBy: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          Setting.create('opgg-renderer/savedPreferences', {
            mode: 'aram',
            position: 'none',
            region: 'global',
            tier: 'all'
          })
        ),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn()
    }
    const logger = { info: vi.fn() }

    await migrateFrom151({ manager, logger } as unknown as Parameters<typeof migrateFrom151>[0])

    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: CHAMPION_DATA_PREFERENCES_KEY,
        value: { mode: 'aram', position: 'none', region: 'global', tier: 'all' }
      })
    )
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: MIGRATION_FROM_151, value: MIGRATION_FROM_151 })
    )
    expect(manager.remove).not.toHaveBeenCalled()
  })

  it('moves the skin selector preference to the unified champion data window', async () => {
    const manager = {
      findOneBy: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(Setting.create(CHAMPION_DATA_PREFERENCES_KEY, {}))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(Setting.create(LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY, true)),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn()
    }
    const logger = { info: vi.fn() }

    await migrateFrom151({ manager, logger } as unknown as Parameters<typeof migrateFrom151>[0])

    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ key: OPGG_SHOW_SKIN_SELECTOR_KEY, value: true })
    )
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: MIGRATION_FROM_151, value: MIGRATION_FROM_151 })
    )
    expect(manager.remove).not.toHaveBeenCalled()
  })

  it('migrates the persisted Mica background material to the unified system value', async () => {
    const manager = {
      findOneBy: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(Setting.create(CHAMPION_DATA_PREFERENCES_KEY, {}))
        .mockResolvedValueOnce(Setting.create(OPGG_SHOW_SKIN_SELECTOR_KEY, false))
        .mockResolvedValueOnce(Setting.create(BACKGROUND_MATERIAL_SETTING_KEY, 'mica')),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn()
    }
    const logger = { info: vi.fn() }

    await migrateFrom151({ manager, logger } as unknown as Parameters<typeof migrateFrom151>[0])

    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: BACKGROUND_MATERIAL_SETTING_KEY,
        value: 'system'
      })
    )
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: MIGRATION_FROM_151, value: MIGRATION_FROM_151 })
    )
    expect(manager.remove).not.toHaveBeenCalled()
  })
})
