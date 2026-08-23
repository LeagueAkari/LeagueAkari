import { describe, expect, it } from 'vitest'

import {
  IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH,
  IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS,
  IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH,
  IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH,
  IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS,
  IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH,
  createDefaultInGameSendCustomTemplateItems,
  createDefaultInGameSendFixedTextPresetItems,
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendPresetTargetShortcuts,
  createDefaultInGameSendRatingPresetOptions,
  getInGameSendCustomTemplateShortcutTargetId,
  getInGameSendFixedTextPresetShortcutTargetId,
  getInGameSendRatingPresetShortcutTargetId,
  normalizeInGameSendCustomTemplateItem,
  normalizeInGameSendCustomTemplateItems,
  normalizeInGameSendFixedTextPresetItem,
  normalizeInGameSendFixedTextPresetItems
} from '.'

describe('in-game-send preset options', () => {
  it('uses the product limits for local preset lists', () => {
    expect(IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS).toBe(50)
    expect(IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS).toBe(20)
  })

  it('creates complete default preset options', () => {
    expect(createDefaultInGameSendRatingPresetOptions()).toEqual({
      targetShortcuts: {
        friendly: null,
        enemy: null,
        all: null
      },
      kda: true,
      winRate: true,
      avgSoloKills: true,
      avgVisionScore: false,
      avgChampionDamage: false,
      avgDamageTaken: false,
      avgGold: false,
      avgCsPerMinute: false,
      avgKillParticipation: false,
      avgDamageGoldEfficiency: false,
      mainChampions: true,
      mainPositions: true,
      nameDisplayStrategy: 'preferChampionName',
      showCurrentChampion: false
    })

    expect(createDefaultInGameSendJunglePresetOptions()).toEqual({
      targetShortcuts: {
        friendly: null,
        enemy: null,
        all: null
      },
      activityPreference: true,
      firstClearDistribution: true,
      earlyGank: true,
      dragonControl: true,
      monsterControl: true,
      mainChampions: true,
      nameDisplayStrategy: 'preferChampionName',
      showCurrentChampion: true
    })

    expect(createDefaultInGameSendPremadePresetOptions()).toEqual({
      targetShortcuts: {
        friendly: null,
        enemy: null,
        all: null
      },
      nameDisplayStrategy: 'preferChampionName'
    })
  })

  it('keeps separate preset defaults independent', () => {
    const ratingDefaults = createDefaultInGameSendRatingPresetOptions()
    const jungleDefaults = createDefaultInGameSendJunglePresetOptions()

    expect(ratingDefaults.targetShortcuts).not.toBe(jungleDefaults.targetShortcuts)
    expect(jungleDefaults.showCurrentChampion).toBe(true)
  })

  it('builds stable rating preset shortcut target ids', () => {
    expect(getInGameSendRatingPresetShortcutTargetId('friendly')).toBe(
      'in-game-send-main/preset/rating/friendly'
    )
  })

  it('creates an empty fixed text preset list by default', () => {
    expect(createDefaultInGameSendFixedTextPresetItems()).toEqual([])
  })

  it('builds stable fixed text preset shortcut target ids', () => {
    expect(getInGameSendFixedTextPresetShortcutTargetId('plain-id')).toBe(
      'in-game-send-main/preset/fixed-text/plain-id'
    )
  })

  it('normalizes fixed text preset item title and content limits', () => {
    const item = normalizeInGameSendFixedTextPresetItem({
      id: 'plain-id',
      title: 't'.repeat(IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH + 1),
      shortcut: '',
      content: 'c'.repeat(IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH + 1)
    })

    expect(item).toEqual({
      id: 'plain-id',
      title: 't'.repeat(IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH),
      shortcut: null,
      content: 'c'.repeat(IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH)
    })
  })

  it('normalizes fixed text preset item count and filters invalid ids', () => {
    const items = normalizeInGameSendFixedTextPresetItems([
      { id: '', title: 'invalid', shortcut: null, content: '' },
      ...Array.from({ length: IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS + 1 }, (_, index) => ({
        id: `item-${index}`,
        title: '',
        shortcut: null,
        content: ''
      }))
    ])

    expect(items).toHaveLength(IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS)
    expect(items[0]?.id).toBe('item-0')
    expect(items.at(-1)?.id).toBe(`item-${IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS - 1}`)
  })

  it('creates an empty custom template list by default', () => {
    expect(createDefaultInGameSendCustomTemplateItems()).toEqual([])
  })

  it('builds stable custom template shortcut target ids', () => {
    expect(getInGameSendCustomTemplateShortcutTargetId('template-id', 'enemy')).toBe(
      'in-game-send-main/preset/custom-template/template-id/enemy'
    )
  })

  it('normalizes custom template limits and target shortcuts', () => {
    const item = normalizeInGameSendCustomTemplateItem({
      id: 'template-id',
      title: 't'.repeat(IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH + 1),
      code: 'c'.repeat(IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH + 1),
      targetShortcuts: {
        friendly: '',
        enemy: 'Ctrl+E',
        all: null
      }
    })

    expect(item).toEqual({
      id: 'template-id',
      title: 't'.repeat(IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH),
      code: 'c'.repeat(IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH),
      targetShortcuts: {
        friendly: null,
        enemy: 'Ctrl+E',
        all: null
      }
    })
  })

  it('normalizes custom template count and filters duplicate ids', () => {
    const items = normalizeInGameSendCustomTemplateItems([
      {
        id: '',
        title: '',
        code: '',
        targetShortcuts: createDefaultInGameSendPresetTargetShortcuts()
      },
      ...Array.from({ length: IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS + 1 }, (_, index) => ({
        id: `template-${index}`,
        title: '',
        code: '',
        targetShortcuts: createDefaultInGameSendPresetTargetShortcuts()
      })),
      {
        id: 'template-0',
        title: 'duplicate',
        code: '',
        targetShortcuts: createDefaultInGameSendPresetTargetShortcuts()
      }
    ])

    expect(items).toHaveLength(IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS)
    expect(items[0]?.id).toBe('template-0')
    expect(items.at(-1)?.id).toBe(`template-${IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS - 1}`)
  })
})
