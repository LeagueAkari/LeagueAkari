import { describe, expect, test } from 'vitest'

import {
  AUTO_SELECT_NAVIGATION_SCOPE,
  MAIN_WINDOW_NAVIGATION_SCOPE,
  SETTINGS_MODAL_NAVIGATION_SCOPE,
  STORAGE_SETTINGS_NAVIGATION_SCOPE,
  type SettingsNavigationTargetDefinition,
  createSettingsNavigationPath,
  createSettingsNavigationRegistry,
  getSettingsNavigationTarget,
  searchableSettingsNavigationTargets,
  settingsNavigationRegistry,
  settingsNavigationTargets
} from './registry'

describe('Akari navigation settings registry', () => {
  test('keeps every target id unique and resolvable', () => {
    expect(settingsNavigationRegistry.size).toBe(settingsNavigationTargets.length)

    for (const target of settingsNavigationTargets) {
      expect(getSettingsNavigationTarget(target.id)).toEqual(target)
    }
  })

  test('keeps searchable rows connected to a navigation route', () => {
    expect(searchableSettingsNavigationTargets.length).toBeGreaterThan(0)

    for (const target of searchableSettingsNavigationTargets) {
      expect('tab' in target.route ? target.route.tab : target.route.name).toBeTruthy()
    }
  })

  test('describes deep links that cross top-level and nested tabs', () => {
    expect(getSettingsNavigationTarget('ongoing-game.player-card.tags')?.route).toEqual({
      tab: 'ongoing-game'
    })
    expect(getSettingsNavigationTarget('storage.saved-settings.import')?.route).toEqual({
      tab: 'storage',
      subTab: 'settings'
    })
    expect(getSettingsNavigationTarget('automation.champ-select.ban.delay')?.route).toEqual({
      name: 'automation',
      section: 'auto-select'
    })
    expect(
      getSettingsNavigationTarget('toolkit.in-game-send.settings.send-interval')?.route
    ).toEqual({
      name: 'toolkit',
      section: 'in-game-send'
    })
  })

  test('builds canonical paths for each supported P0 navigation surface', () => {
    const settingsTarget = getSettingsNavigationTarget('ongoing-game.player-card.tags')!
    const storageTarget = getSettingsNavigationTarget('storage.saved-settings.import')!
    const autoSelectTarget = getSettingsNavigationTarget('automation.champ-select.ban.delay')!
    const toolkitTarget = getSettingsNavigationTarget(
      'toolkit.in-game-send.settings.send-interval'
    )!

    expect(createSettingsNavigationPath(settingsTarget)).toEqual([
      {
        scope: MAIN_WINDOW_NAVIGATION_SCOPE,
        destination: { surface: 'settings-modal' },
        waitForRegistration: true
      },
      {
        scope: SETTINGS_MODAL_NAVIGATION_SCOPE,
        destination: 'ongoing-game',
        waitForRegistration: true
      },
      {
        scope: 'settings-target',
        destination: settingsTarget.id,
        waitForRegistration: false
      }
    ])
    expect(createSettingsNavigationPath(storageTarget).map((step) => step.scope)).toEqual([
      MAIN_WINDOW_NAVIGATION_SCOPE,
      SETTINGS_MODAL_NAVIGATION_SCOPE,
      STORAGE_SETTINGS_NAVIGATION_SCOPE,
      'settings-target'
    ])
    expect(createSettingsNavigationPath(autoSelectTarget)).toContainEqual({
      scope: AUTO_SELECT_NAVIGATION_SCOPE,
      destination: 'ban',
      waitForRegistration: true
    })
    expect(createSettingsNavigationPath(toolkitTarget).map((step) => step.scope)).toEqual([
      MAIN_WINDOW_NAVIGATION_SCOPE,
      'main-page.toolkit',
      'settings-target'
    ])
  })

  test('gives every registered target a root-to-terminal canonical path', () => {
    for (const target of settingsNavigationTargets) {
      const path = createSettingsNavigationPath(target)
      expect(path[0]?.scope).toBe(MAIN_WINDOW_NAVIGATION_SCOPE)
      expect(path.at(-1)).toEqual({
        scope: 'settings-target',
        destination: target.id,
        waitForRegistration: false
      })
    }
  })

  test('rejects duplicate ids', () => {
    const duplicateTargets: SettingsNavigationTargetDefinition[] = [
      {
        id: 'duplicate',
        kind: 'row',
        route: { tab: 'basic' },
        labelKey: 'first'
      },
      {
        id: 'duplicate',
        kind: 'row',
        route: { tab: 'misc' },
        labelKey: 'second'
      }
    ]

    expect(() => createSettingsNavigationRegistry(duplicateTargets)).toThrow(
      'Duplicate settings navigation target: duplicate'
    )
  })

  test('rejects missing parent and fallback targets', () => {
    const target: SettingsNavigationTargetDefinition = {
      id: 'child',
      kind: 'row',
      route: { tab: 'basic' },
      labelKey: 'child',
      parentId: 'missing-parent'
    }

    expect(() => createSettingsNavigationRegistry([target])).toThrow(
      'Unknown settings navigation target missing-parent referenced by child'
    )
  })

  test('rejects fallback cycles', () => {
    const cyclicTargets: SettingsNavigationTargetDefinition[] = [
      {
        id: 'first',
        kind: 'row',
        route: { tab: 'basic' },
        labelKey: 'first',
        fallbackId: 'second'
      },
      {
        id: 'second',
        kind: 'row',
        route: { tab: 'basic' },
        labelKey: 'second',
        fallbackId: 'first'
      }
    ]

    expect(() => createSettingsNavigationRegistry(cyclicTargets)).toThrow(
      'Settings navigation fallback cycle detected from first'
    )
  })
})
