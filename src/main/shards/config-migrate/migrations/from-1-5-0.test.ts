import 'reflect-metadata'

import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import { describe, expect, it, vi } from 'vitest'

import { Setting } from '../../storage/entities/Settings'
import {
  MIGRATION_FROM_150,
  PLAYER_CARD_TAGS_SETTING_KEY,
  migrateFrom150,
  repairPlayerCardTagsSetting
} from './from-1-5-0'

describe('repairPlayerCardTagsSetting', () => {
  it('repairs the 1.5.0 Setting wrapper while preserving nested user choices', () => {
    const defaults = createDefaultOngoingGamePanelPlayerCardTagSettings()
    const corrupted = {
      key: PLAYER_CARD_TAGS_SETTING_KEY,
      value: {
        ...defaults,
        showMetTag: false,
        showTaggedTag: false
      },
      showAverageKillDamageEfficiencyTag: true
    }

    expect(repairPlayerCardTagsSetting(corrupted)).toEqual({
      ...defaults,
      showMetTag: false,
      showTaggedTag: false,
      showAverageKillDamageEfficiencyTag: true
    })
  })

  it('prefers choices changed after the broken migration over the nested value', () => {
    const defaults = createDefaultOngoingGamePanelPlayerCardTagSettings()
    const corrupted = {
      key: PLAYER_CARD_TAGS_SETTING_KEY,
      value: {
        ...defaults,
        showMetTag: false
      },
      showMetTag: true
    }

    expect(repairPlayerCardTagsSetting(corrupted).showMetTag).toBe(true)
  })

  it('maps the legacy solo-deaths setting to the current easy-gank setting', () => {
    const repaired = repairPlayerCardTagsSetting({
      showSoloDeathsTag: false,
      showMetTag: false
    })

    expect(repaired.showEasyGankTag).toBe(false)
    expect(repaired.showMetTag).toBe(false)
  })

  it('keeps recognized booleans and restores invalid fields from defaults', () => {
    const defaults = createDefaultOngoingGamePanelPlayerCardTagSettings()

    expect(
      repairPlayerCardTagsSetting({
        showMetTag: 'false',
        showTaggedTag: false,
        unknownTag: true
      })
    ).toEqual({
      ...defaults,
      showTaggedTag: false
    })
  })
})

describe('from 1.5.0 migration', () => {
  it('repairs the stored setting and records the migration marker', async () => {
    const defaults = createDefaultOngoingGamePanelPlayerCardTagSettings()
    const manager = {
      findOneBy: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          Setting.create(PLAYER_CARD_TAGS_SETTING_KEY, {
            key: PLAYER_CARD_TAGS_SETTING_KEY,
            value: {
              ...defaults,
              showMetTag: false
            },
            showAverageKillDamageEfficiencyTag: true
          })
        ),
      save: vi.fn().mockResolvedValue(undefined)
    }
    const logger = {
      info: vi.fn()
    }

    await migrateFrom150({ manager, logger } as unknown as Parameters<typeof migrateFrom150>[0])

    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: PLAYER_CARD_TAGS_SETTING_KEY,
        value: {
          ...defaults,
          showMetTag: false,
          showAverageKillDamageEfficiencyTag: true
        }
      })
    )
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: MIGRATION_FROM_150,
        value: MIGRATION_FROM_150
      })
    )
  })

  it('does nothing after the migration marker exists', async () => {
    const manager = {
      findOneBy: vi.fn().mockResolvedValue(Setting.create(MIGRATION_FROM_150, MIGRATION_FROM_150)),
      save: vi.fn()
    }
    const logger = {
      info: vi.fn()
    }

    await migrateFrom150({ manager, logger } as unknown as Parameters<typeof migrateFrom150>[0])

    expect(manager.findOneBy).toHaveBeenCalledTimes(1)
    expect(manager.save).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
  })
})
