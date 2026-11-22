import 'reflect-metadata'

import type { FindOperator } from 'typeorm'
import { describe, expect, it } from 'vitest'

import { Setting } from '../../storage/entities/Settings'
import type { MigrationContext } from './context'
import { BACKGROUND_MATERIAL_SETTING_KEY, MIGRATION_FROM_151, migrateFrom151 } from './from-1-5-1'

function setup(initial: Record<string, unknown> = {}) {
  const settings = new Map(
    Object.entries(initial).map(([key, value]) => [key, Setting.create(key, value)])
  )

  const context = {
    manager: {
      findOneBy: async (_: unknown, { key }: { key: string | FindOperator<string> }) =>
        settings.get(typeof key === 'string' ? key : key.value),

      findBy: async (
        _: unknown,
        where: { key: FindOperator<string> } | { key: FindOperator<string> }[]
      ) => {
        const queries = Array.isArray(where) ? where : [where]

        return [...settings.values()].filter((setting) =>
          queries.some(({ key }) => setting.key.startsWith(key.value.slice(0, -1)))
        )
      },

      save: async (setting: Setting) => settings.set(setting.key, setting),

      remove: async (records: Setting | Setting[]) => {
        for (const setting of Array.isArray(records) ? records : [records]) {
          settings.delete(setting.key)
        }
      }
    },
    logger: { info: () => {} }
  }

  return { settings, context: context as unknown as MigrationContext }
}

const AUX = 'window-manager-main/aux-window'
const OPGG = 'window-manager-main/opgg-window'
const SECONDARY = 'window-manager-main/secondary-window'

describe('from 1.5.1 migration', () => {
  it('combines the released windows directly and preserves their distinct display preferences', async () => {
    const bounds = { x: -1200, y: 80, width: 640, height: 800 }
    const { settings, context } = setup({
      [`${AUX}/enabled`]: true,
      [`${AUX}/autoShow`]: false,
      [`${AUX}/showSkinSelector`]: true,
      [`${AUX}/opacity`]: 0.5,
      [`${AUX}/quickCloseTip`]: true,
      [`${OPGG}/enabled`]: true,
      [`${OPGG}/autoShow`]: true,
      [`${OPGG}/trackedBounds`]: bounds,
      [`${OPGG}/opacity`]: 0.8,
      [`${OPGG}/pinned`]: false,
      [`${OPGG}/showShortcut`]: 'LeftControl+F12',
      'auto-champ-config-main/enabled': true
    })

    await migrateFrom151(context)

    expect(Object.fromEntries([...settings].map(([key, setting]) => [key, setting.value]))).toEqual(
      {
        [`${SECONDARY}/enabled`]: true,
        [`${SECONDARY}/autoShowInLobby`]: false,
        [`${SECONDARY}/autoShowInChampSelect`]: true,
        [`${SECONDARY}/showSkinSelector`]: true,
        [`${SECONDARY}/trackedBounds`]: bounds,
        [`${SECONDARY}/opacity`]: 0.8,
        [`${SECONDARY}/pinned`]: false,
        [`${SECONDARY}/showShortcut`]: 'LeftControl+F12',
        'auto-champ-config-main/enabled': true,
        [MIGRATION_FROM_151]: MIGRATION_FROM_151
      }
    )
  })

  it.each([
    [false, true, true, false, true],
    [false, false, false, false, false]
  ])(
    'respects disabled windows when aux=%s and opgg=%s',
    async (aux, opgg, enabled, lobby, selection) => {
      const { settings, context } = setup({
        [`${AUX}/enabled`]: aux,
        [`${OPGG}/enabled`]: opgg
      })

      await migrateFrom151(context)

      expect(settings.get(`${SECONDARY}/enabled`)?.value).toBe(enabled)
      expect(settings.get(`${SECONDARY}/autoShowInLobby`)?.value).toBe(lobby)
      expect(settings.get(`${SECONDARY}/autoShowInChampSelect`)?.value).toBe(selection)
    }
  )

  it('moves the actual released OP.GG preferences and removes retired automation settings', async () => {
    const { settings, context } = setup({
      'opgg-renderer/savedPreferences': {
        mode: 'aram',
        position: 'none',
        region: 'kr',
        tier: 'diamond_plus',
        flashPosition: 'f'
      },
      'opgg-renderer/autoApplyRunes': true,
      'opgg-renderer/autoApplySpells': true,
      'opgg-renderer/autoApplyItems': true,
      'auto-select-main/enabled': true
    })

    await migrateFrom151(context)

    expect(settings.get('champion-data-main/opggPreferences')?.value).toEqual({
      mode: 'aram',
      position: 'top',
      region: 'kr',
      tier: 'diamond_plus'
    })
    expect(settings.get('champion-data-main/opggFlashPosition')?.value).toBe('f')
    expect(settings.get('champion-data-main/automation')?.value).toEqual({
      enabled: true,
      opgg: { region: 'kr', tier: 'diamond_plus' },
      qq101: { tier: 255 }
    })
    expect([...settings.keys()].some((key) => key.startsWith('opgg-renderer/'))).toBe(false)
    expect(settings.get('auto-select-main/enabled')?.value).toBe(true)
  })

  it('leaves fresh-install defaults alone and does not overwrite later changes on restart', async () => {
    const { settings, context } = setup()

    await migrateFrom151(context)

    expect([...settings.keys()]).toEqual([MIGRATION_FROM_151])

    settings.set(`${SECONDARY}/enabled`, Setting.create(`${SECONDARY}/enabled`, false))
    const completed = new Map(settings)

    await migrateFrom151(context)

    expect(settings).toEqual(completed)
  })

  it('migrates the released background material setting', async () => {
    const { settings, context } = setup({ [BACKGROUND_MATERIAL_SETTING_KEY]: 'mica' })

    await migrateFrom151(context)

    expect(settings.get(BACKGROUND_MATERIAL_SETTING_KEY)?.value).toBe('system')
  })

  it.each([
    ['auto', 'system'],
    ['force', 'fixed-servers'],
    ['disable', 'direct']
  ])('migrates proxy strategy %s to %s', async (strategy, migratedStrategy) => {
    const proxy = { strategy, host: 'localhost', port: 1080 }
    const { settings, context } = setup({ 'app-common-main/httpProxy': proxy })

    await migrateFrom151(context)

    expect(settings.get('network-main/httpProxy')?.value).toEqual({
      ...proxy,
      strategy: migratedStrategy
    })
    expect(settings.has('app-common-main/httpProxy')).toBe(false)
  })
})
