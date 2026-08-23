import type {
  InGameSendCustomTemplateItem,
  InGameSendFixedTextPresetItem,
  InGameSendJunglePresetOptions,
  InGameSendPremadePresetOptions,
  InGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { z } from 'zod'

const presetTargetShortcutsSchema = z.object({
  friendly: z.string().nullable(),
  enemy: z.string().nullable(),
  all: z.string().nullable()
})

const presetNameDisplayStrategySchema = z.enum([
  'preferName',
  'preferChampionName',
  'championNameWithName'
])

export const inGameSendRatingPresetOptionsSchema: z.ZodType<InGameSendRatingPresetOptions> =
  z.object({
    targetShortcuts: presetTargetShortcutsSchema,
    kda: z.boolean(),
    winRate: z.boolean(),
    avgSoloKills: z.boolean(),
    avgVisionScore: z.boolean(),
    avgChampionDamage: z.boolean(),
    avgDamageTaken: z.boolean(),
    avgGold: z.boolean(),
    avgCsPerMinute: z.boolean(),
    avgKillParticipation: z.boolean(),
    avgDamageGoldEfficiency: z.boolean(),
    mainChampions: z.boolean(),
    mainPositions: z.boolean(),
    nameDisplayStrategy: presetNameDisplayStrategySchema,
    showCurrentChampion: z.boolean()
  })

export const inGameSendJunglePresetOptionsSchema: z.ZodType<InGameSendJunglePresetOptions> =
  z.object({
    targetShortcuts: presetTargetShortcutsSchema,
    activityPreference: z.boolean(),
    firstClearDistribution: z.boolean(),
    earlyGank: z.boolean(),
    dragonControl: z.boolean(),
    monsterControl: z.boolean(),
    mainChampions: z.boolean(),
    nameDisplayStrategy: presetNameDisplayStrategySchema,
    showCurrentChampion: z.boolean()
  })

export const inGameSendPremadePresetOptionsSchema: z.ZodType<InGameSendPremadePresetOptions> =
  z.object({
    targetShortcuts: presetTargetShortcutsSchema,
    nameDisplayStrategy: presetNameDisplayStrategySchema
  })

export const inGameSendFixedTextPresetItemsSchema: z.ZodType<InGameSendFixedTextPresetItem[]> =
  z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      shortcut: z.string().nullable(),
      content: z.string()
    })
  )

export const inGameSendCustomTemplateItemsSchema: z.ZodType<InGameSendCustomTemplateItem[]> =
  z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      code: z.string(),
      targetShortcuts: presetTargetShortcutsSchema
    })
  )
