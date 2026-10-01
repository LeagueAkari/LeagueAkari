import 'reflect-metadata'

import type { FindOperator } from 'typeorm'
import { describe, expect, it, vi } from 'vitest'

import { Setting } from '../../storage/entities/Settings'
import type { MigrationContext } from './context'
import {
  BACKGROUND_MATERIAL_SETTING_KEY,
  LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY,
  MIGRATION_CHAMPION_DATA_WINDOW,
  MIGRATION_FROM_151,
  OPGG_SHOW_SKIN_SELECTOR_KEY,
  migrateChampionDataWindow,
  migrateFrom151
} from './from-1-5-1'

describe('from 1.5.1 migration', () => {
  it('moves the skin selector preference to the unified champion data window', async () => {
    const manager = {
      findOneBy: vi
        .fn()
        .mockResolvedValueOnce(null)
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

const LEGACY_KEY = 'app-common-main/httpProxy'
const NETWORK_KEY = 'network-main/httpProxy'

function setup(initial: Setting[] = []) {
  const settings = new Map(initial.map((setting) => [setting.key, setting]))
  const context = {
    manager: {
      findOneBy: async (_: unknown, { key }: { key: string | FindOperator<string> }) =>
        settings.get(typeof key === 'string' ? key : key.value),
      save: async (setting: Setting) => settings.set(setting.key, setting),
      remove: async (setting: Setting) => settings.delete(setting.key)
    },
    logger: { info: () => {} }
  }
  return { settings, context: context as unknown as MigrationContext }
}

describe('network proxy settings migration', () => {
  it.each([
    ['auto', 'system'],
    ['force', 'fixed-servers'],
    ['disable', 'direct']
  ])('migrates %s to %s and preserves host and port', async (strategy, migratedStrategy) => {
    const proxy = { strategy, host: 'localhost', port: 1080 }
    const { settings, context } = setup([Setting.create(LEGACY_KEY, proxy)])

    await migrateFrom151(context)

    expect(settings.get(NETWORK_KEY)?.value).toEqual({ ...proxy, strategy: migratedStrategy })
    expect(settings.has(LEGACY_KEY)).toBe(false)
    expect(settings.has(MIGRATION_FROM_151)).toBe(true)
  })

  it('keeps an existing network setting and removes the obsolete key', async () => {
    const current = { strategy: 'system', host: 'localhost', port: 7897 }
    const { settings, context } = setup([
      Setting.create(LEGACY_KEY, { strategy: 'force', host: 'localhost', port: 1080 }),
      Setting.create(NETWORK_KEY, current)
    ])

    await migrateFrom151(context)

    expect(settings.get(NETWORK_KEY)?.value).toEqual(current)
    expect(settings.has(LEGACY_KEY)).toBe(false)
  })
})

const LEGACY_NAMESPACE = 'window-manager-main/opgg-window'
const CURRENT_NAMESPACE = 'window-manager-main/champion-data-window'

describe('champion data window migration', () => {
  it('moves only stable window preferences and leaves champion configuration untouched', async () => {
    const preferences = {
      trackedBounds: { x: -1200, y: 80, width: 640, height: 800 },
      enabled: false,
      autoShow: false,
      opacity: 0.8,
      pinned: false,
      showShortcut: null,
      showSkinSelector: true
    }
    const excluded = [
      Setting.create(`${LEGACY_NAMESPACE}/autoApplyRunes`, true),
      Setting.create(`${LEGACY_NAMESPACE}/unknownPreference`, 'keep'),
      Setting.create('auto-champ-config-main/enabled', true),
      Setting.create('opgg-renderer/preferences', { flashPosition: 'd' })
    ]
    const { settings, context } = setup([
      ...Object.entries(preferences).map(([key, value]) =>
        Setting.create(`${LEGACY_NAMESPACE}/${key}`, value)
      ),
      ...excluded
    ])

    await migrateChampionDataWindow(context)

    expect(settings).toEqual(
      new Map(
        [
          ...Object.entries(preferences).map(([key, value]) =>
            Setting.create(`${CURRENT_NAMESPACE}/${key}`, value)
          ),
          ...excluded,
          Setting.create(MIGRATION_CHAMPION_DATA_WINDOW, MIGRATION_CHAMPION_DATA_WINDOW)
        ].map((setting) => [setting.key, setting])
      )
    )
  })

  it('preserves existing target values and does not repeat a completed migration', async () => {
    const legacyKey = `${LEGACY_NAMESPACE}/enabled`
    const currentKey = `${CURRENT_NAMESPACE}/enabled`
    const { settings, context } = setup([
      Setting.create(legacyKey, true),
      Setting.create(currentKey, false)
    ])

    await migrateChampionDataWindow(context)

    expect(settings.get(currentKey)?.value).toBe(false)
    expect(settings.has(legacyKey)).toBe(false)
    expect(settings.has(`${CURRENT_NAMESPACE}/trackedBounds`)).toBe(false)

    settings.set(legacyKey, Setting.create(legacyKey, true))
    const completed = new Map(settings)
    await migrateChampionDataWindow(context)
    expect(settings).toEqual(completed)
  })

  it('carries forward the skin selector preference produced by the previous migration', async () => {
    const { settings, context } = setup([Setting.create(LEGACY_AUX_SHOW_SKIN_SELECTOR_KEY, true)])

    await migrateFrom151(context)
    await migrateChampionDataWindow(context)

    expect(settings.get(`${CURRENT_NAMESPACE}/showSkinSelector`)?.value).toBe(true)
    expect(settings.has(`${LEGACY_NAMESPACE}/showSkinSelector`)).toBe(false)
  })
})
