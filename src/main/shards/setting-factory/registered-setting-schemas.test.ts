import {
  createDefaultInGameSendCustomTemplateItems,
  createDefaultInGameSendFixedTextPresetItems,
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game'
import { describe, expect, it } from 'vitest'

import {
  championRunesV2PresetSchema,
  summonerSpellsPresetSchema
} from '../auto-champ-config/setting-schemas'
import {
  autoSelectBanConfigSchema,
  autoSelectPickConfigSchema
} from '../auto-select/setting-schemas'
import {
  inGameSendCustomTemplateItemsSchema,
  inGameSendFixedTextPresetItemsSchema,
  inGameSendJunglePresetOptionsSchema,
  inGameSendPremadePresetOptionsSchema,
  inGameSendRatingPresetOptionsSchema
} from '../in-game-send/setting-schemas'
import { ongoingGamePlayerCardTagsSchema } from '../ongoing-game/setting-schemas'

describe('registered complex setting schemas', () => {
  it.each([
    ['auto champion runes', championRunesV2PresetSchema, {}],
    ['auto champion spells', summonerSpellsPresetSchema, {}],
    ['auto select pick config', autoSelectPickConfigSchema, {}],
    ['auto select ban config', autoSelectBanConfigSchema, {}],
    [
      'in-game rating preset',
      inGameSendRatingPresetOptionsSchema,
      createDefaultInGameSendRatingPresetOptions()
    ],
    [
      'in-game jungle preset',
      inGameSendJunglePresetOptionsSchema,
      createDefaultInGameSendJunglePresetOptions()
    ],
    [
      'in-game premade preset',
      inGameSendPremadePresetOptionsSchema,
      createDefaultInGameSendPremadePresetOptions()
    ],
    [
      'in-game custom templates',
      inGameSendCustomTemplateItemsSchema,
      createDefaultInGameSendCustomTemplateItems()
    ],
    [
      'in-game fixed text preset',
      inGameSendFixedTextPresetItemsSchema,
      createDefaultInGameSendFixedTextPresetItems()
    ],
    [
      'ongoing game player card tags',
      ongoingGamePlayerCardTagsSchema,
      createDefaultOngoingGamePanelPlayerCardTagSettings()
    ]
  ])('accepts the %s default', (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true)
  })

  it('preserves extra player card tag keys', () => {
    const value = {
      ...createDefaultOngoingGamePanelPlayerCardTagSettings(),
      futureTag: { enabled: true }
    }

    expect(ongoingGamePlayerCardTagsSchema.parse(value)).toEqual(value)
  })

  it('does not preserve extra in-game preset option keys', () => {
    const value = {
      ...createDefaultInGameSendRatingPresetOptions(),
      futureOption: true
    }

    expect(inGameSendRatingPresetOptionsSchema.parse(value)).not.toHaveProperty('futureOption')
  })
})
