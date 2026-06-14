import { describe, expect, it } from 'vitest'

import {
  createDefaultInGameSendPresetOptions,
  getInGameSendPresetShortcutTargetId,
  mergeInGameSendPresetOptions,
  normalizeInGameSendPresetOptions
} from './in-game-send'

describe('in-game-send preset options', () => {
  it('keeps empty option arrays as explicit configuration', () => {
    const options = normalizeInGameSendPresetOptions({
      rating: {
        enabledMetrics: []
      },
      jungle: {
        enabledModules: []
      }
    })

    expect(options.rating.enabledMetrics).toEqual([])
    expect(options.jungle.enabledModules).toEqual([])
  })

  it('normalizes unknown option ids while merging patches', () => {
    const defaults = createDefaultInGameSendPresetOptions()
    const options = mergeInGameSendPresetOptions(defaults, {
      rating: {
        enabledMetrics: ['kda', 'unknown' as any]
      }
    })

    expect(options.rating.enabledMetrics).toEqual(['kda'])
    expect(options.jungle.enabledModules).toEqual(defaults.jungle.enabledModules)
  })

  it('merges target shortcut patches without replacing the whole target map', () => {
    const defaults = createDefaultInGameSendPresetOptions()
    const options = mergeInGameSendPresetOptions(
      {
        ...defaults,
        rating: {
          ...defaults.rating,
          targetShortcuts: {
            friendly: 'Ctrl+1',
            enemy: 'Ctrl+2',
            all: null
          }
        }
      },
      {
        rating: {
          targetShortcuts: {
            enemy: null
          }
        }
      }
    )

    expect(options.rating.targetShortcuts).toEqual({
      friendly: 'Ctrl+1',
      enemy: null,
      all: null
    })
  })

  it('builds stable preset shortcut target ids', () => {
    expect(getInGameSendPresetShortcutTargetId('rating', 'friendly')).toBe(
      'in-game-send-main/preset/rating/friendly'
    )
  })
})
