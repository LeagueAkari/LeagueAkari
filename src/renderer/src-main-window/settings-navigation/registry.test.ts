import { getSearchableNavigationTargets } from '@renderer-shared/components/settings-navigation/targets'
import { mainWindowTargets } from '@renderer-shared/components/settings-navigation/targets/main-window'
import { createSettingsNavigationTargetStepKey } from '@renderer-shared/components/settings-navigation/useSettingsNavigationTarget'
import { describe, expect, test } from 'vitest'

import {
  APP_SETTINGS_NAVIGATION_STEP_KEY,
  SETTINGS_MODAL_NAVIGATION_STEP_KEY
} from '@main-window/components/settings-modal/navigation'
import { STORAGE_SETTINGS_NAVIGATION_STEP_KEY } from '@main-window/components/settings-modal/storage-settings/navigation'
import {
  MAIN_WINDOW_ROUTE_STEP_KEY,
  createMainPageNavigationStepKey
} from '@main-window/routes/navigation-steps'
import { AUTO_SELECT_NAVIGATION_STEP_KEY } from '@main-window/views/automation/auto-select-navigation'

import { createSettingsNavigationPath, getSettingsNavigationTarget } from './registry'

const targetIds = mainWindowTargets.flatMap((group) => group.targets.map((target) => target.id))

describe('Settings navigation registry', () => {
  test('keeps every target id unique and resolvable', () => {
    expect(new Set(targetIds).size).toBe(targetIds.length)

    for (const id of targetIds) {
      const target = getSettingsNavigationTarget(id)!
      expect(target.id).toBe(id)

      for (const linkedId of [target.terminalId, target.fallbackId]) {
        if (linkedId) {
          expect(getSettingsNavigationTarget(linkedId)).toBeDefined()
        }
      }
    }
  })

  test('adds secondary preferences to search only when their window is enabled', () => {
    const main = getSearchableNavigationTargets(false)
    const all = getSearchableNavigationTargets(true)
    const flash = all.find(({ address }) => address.targetId === 'champion-data.flash-position')

    expect(flash?.address.window).toBe('secondary-window')
    expect(flash?.groupKeys).toEqual([
      'settings.multiWindow.secondaryWindow.title',
      'opgg.view.settings.sections.preferences'
    ])
    expect(all.filter(({ address }) => address.window === 'main-window')).toEqual(main)
    expect(main).toContainEqual(
      expect.objectContaining({
        address: { window: 'main-window', targetId: 'multi-window.secondary.enabled' },
        groupKeys: ['settings.multiWindow.title', 'settings.multiWindow.secondaryWindow.title']
      })
    )
  })

  test('describes deep links that cross top-level and nested tabs', () => {
    expect(getSettingsNavigationTarget('ongoing-game.player-card.tags')?.route).toEqual({
      tab: 'ongoing-game'
    })
    expect(getSettingsNavigationTarget('storage.saved-settings.import')?.route).toEqual({
      tab: 'storage',
      subTab: 'settings'
    })
    expect(getSettingsNavigationTarget('storage.tagged-players')?.route).toEqual({
      tab: 'storage',
      subTab: 'tagged-players'
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
    expect(
      getSettingsNavigationTarget('toolkit.client.league-client-ux.adjust-window-size')?.route
    ).toEqual({
      name: 'toolkit',
      section: 'client'
    })
    expect(
      getSettingsNavigationTarget('toolkit.misc.chat-availability.availability')?.route
    ).toEqual({
      name: 'toolkit',
      section: 'misc'
    })
  })

  test('builds canonical paths for each supported P0 navigation surface', () => {
    const settingsTarget = getSettingsNavigationTarget('ongoing-game.player-card.tags')!
    const taggedPlayersTarget = getSettingsNavigationTarget('storage.tagged-players')!
    const storageTarget = getSettingsNavigationTarget('storage.saved-settings.import')!
    const autoSelectTarget = getSettingsNavigationTarget('automation.champ-select.ban.delay')!
    const toolkitTarget = getSettingsNavigationTarget(
      'toolkit.in-game-send.settings.send-interval'
    )!

    expect(createSettingsNavigationPath(settingsTarget)).toEqual([
      {
        key: SETTINGS_MODAL_NAVIGATION_STEP_KEY,
        payload: 'ongoing-game'
      },
      {
        key: createSettingsNavigationTargetStepKey(settingsTarget.id)
      }
    ])
    expect(createSettingsNavigationPath(storageTarget).map((step) => step.key)).toEqual([
      SETTINGS_MODAL_NAVIGATION_STEP_KEY,
      STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
      createSettingsNavigationTargetStepKey(storageTarget.id)
    ])
    expect(createSettingsNavigationPath(taggedPlayersTarget).map((step) => step.key)).toEqual([
      SETTINGS_MODAL_NAVIGATION_STEP_KEY,
      STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
      createSettingsNavigationTargetStepKey(taggedPlayersTarget.id)
    ])
    expect(createSettingsNavigationPath(autoSelectTarget)).toContainEqual({
      key: AUTO_SELECT_NAVIGATION_STEP_KEY,
      payload: { tab: 'ban' }
    })
    expect(
      createSettingsNavigationPath(autoSelectTarget, { autoSelectGroupId: 'aram' })
    ).toContainEqual({
      key: AUTO_SELECT_NAVIGATION_STEP_KEY,
      payload: { tab: 'ban', groupId: 'aram' }
    })
    expect(createSettingsNavigationPath(toolkitTarget)).toEqual([
      {
        key: MAIN_WINDOW_ROUTE_STEP_KEY,
        payload: { name: 'toolkit', params: { section: 'in-game-send' } }
      },
      { key: createMainPageNavigationStepKey('toolkit'), payload: 'in-game-send' },
      { key: createSettingsNavigationTargetStepKey(toolkitTarget.id) }
    ])
  })

  test('keeps conditional preparation and virtual target fallback in the business path', () => {
    const conditionalTarget = getSettingsNavigationTarget('app.misc.http-proxy.host')!
    const virtualTarget = getSettingsNavigationTarget(
      'automation.gameflow.aram-team-side.visible-to-team'
    )!

    expect(createSettingsNavigationPath(conditionalTarget)).toContainEqual({
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'forced-http-proxy'
    })
    expect(createSettingsNavigationPath(virtualTarget).at(-1)).toEqual({
      key: createSettingsNavigationTargetStepKey('automation.gameflow.aram-team-side.enabled')
    })
  })

  test('gives every registered target a root-to-terminal canonical path', () => {
    for (const id of targetIds) {
      const target = getSettingsNavigationTarget(id)!
      const path = createSettingsNavigationPath(target)
      expect(path[0]?.key).toBe(
        'tab' in target.route ? SETTINGS_MODAL_NAVIGATION_STEP_KEY : MAIN_WINDOW_ROUTE_STEP_KEY
      )
      expect(path.at(-1)).toEqual({
        key: createSettingsNavigationTargetStepKey(target.terminalId ?? target.id)
      })
    }
  })
})
