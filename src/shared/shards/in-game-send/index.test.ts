import { describe, expect, it } from 'vitest'

import {
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions,
  getInGameSendRatingPresetShortcutTargetId
} from '.'

describe('in-game-send preset options', () => {
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
})
