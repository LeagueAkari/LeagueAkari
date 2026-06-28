import {
  IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS,
  type InGameSendFixedTextPresetItem,
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions,
  getInGameSendFixedTextPresetShortcutTargetId
} from '@shared/shards/in-game-send'
import { describe, expect, it, vi } from 'vitest'

import { InGameSendPresetController } from './preset-controller'

function createController() {
  const settings = {
    ratingPresetOptions: createDefaultInGameSendRatingPresetOptions(),
    junglePresetOptions: createDefaultInGameSendJunglePresetOptions(),
    premadePresetOptions: createDefaultInGameSendPremadePresetOptions(),
    fixedTextPresetItems: [] as InGameSendFixedTextPresetItem[]
  }

  const context = {
    settings,
    settingService: {
      set: vi.fn(async (key: keyof typeof settings, value: (typeof settings)[typeof key]) => {
        ;(settings[key] as (typeof settings)[typeof key]) = value
      })
    },
    keyboardShortcuts: {
      register: vi.fn(),
      unregisterByTargetId: vi.fn()
    },
    logger: {
      warn: vi.fn()
    },
    mobxUtils: {
      reaction: vi.fn((selector: () => unknown, effect: () => void) => {
        selector()
        effect()
      })
    }
  } as any

  const sendExecutor = {
    sendLines: vi.fn(async (lines: string[]) => lines.length > 0)
  } as any

  return {
    context,
    settings,
    sendExecutor,
    controller: new InGameSendPresetController(context, sendExecutor)
  }
}

describe('InGameSendPresetController fixed text preset', () => {
  it('creates fixed text items with main-process ids', async () => {
    const { controller, settings } = createController()

    const item = await controller.createFixedTextPresetItem()

    expect(item).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      title: '',
      shortcut: null,
      content: ''
    })
    expect(settings.fixedTextPresetItems).toEqual([item])
  })

  it('rejects fixed text item creation at the shared limit', async () => {
    const { controller, settings } = createController()
    settings.fixedTextPresetItems = Array.from(
      { length: IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS },
      (_, index) => ({
        id: `item-${index}`,
        title: '',
        shortcut: null,
        content: ''
      })
    )

    await expect(controller.createFixedTextPresetItem()).rejects.toThrow(
      'Fixed text preset item limit reached'
    )
  })

  it('generates actual send lines from saved fixed text content', () => {
    const { controller, settings } = createController()
    settings.fixedTextPresetItems = [
      {
        id: 'plain-id',
        title: '',
        shortcut: null,
        content: 'line 1\n\n  \nline 2\r\n\t\rline 3'
      }
    ]

    expect(controller.generateFixedTextPresetLines('plain-id')).toEqual([
      'line 1',
      'line 2',
      'line 3'
    ])
  })

  it('registers one shortcut target for each saved fixed text item', () => {
    const { context, controller, settings } = createController()
    settings.fixedTextPresetItems = [
      {
        id: 'plain-id',
        title: '',
        shortcut: 'Ctrl+Shift+F',
        content: 'hello'
      }
    ]

    controller.start()

    expect(context.keyboardShortcuts.register).toHaveBeenCalledWith(
      getInGameSendFixedTextPresetShortcutTargetId('plain-id'),
      'Ctrl+Shift+F',
      'last-active',
      expect.any(Function)
    )
  })
})
