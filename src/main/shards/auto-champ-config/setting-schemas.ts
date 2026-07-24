import { z } from 'zod'

import type { AutoChampConfigSettings } from './state'

const championRunesConfigSchema = z.object({
  primaryStyleId: z.number(),
  subStyleId: z.number(),
  selectedPerkIds: z.array(z.number())
})

const summonerSpellsConfigSchema = z.object({
  spell1Id: z.number(),
  spell2Id: z.number()
})

export const championRunesV2PresetSchema: z.ZodType<AutoChampConfigSettings['runesV2']> = z.record(
  z.string(),
  z.record(z.string(), championRunesConfigSchema.nullable())
)

export const summonerSpellsPresetSchema: z.ZodType<AutoChampConfigSettings['summonerSpells']> =
  z.record(z.string(), z.record(z.string(), summonerSpellsConfigSchema.nullable()))
