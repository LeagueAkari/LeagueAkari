import {
  CHAMPION_DATA_SOURCE_ORDER,
  type ChampionDataSourcePreferences
} from '@shared/types/champion-data'
import { z } from 'zod'

export function createChampionDataSourcePreferences(): ChampionDataSourcePreferences {
  return { enabled: { opgg: true, qq101: true }, defaultSource: 'opgg' }
}

export const championDataSourcePreferencesSchema = z
  .object({
    enabled: z.object({ opgg: z.boolean(), qq101: z.boolean() }),
    defaultSource: z.enum(CHAMPION_DATA_SOURCE_ORDER).nullable()
  })
  .transform((preferences): ChampionDataSourcePreferences => ({
    ...preferences,
    defaultSource:
      preferences.defaultSource && preferences.enabled[preferences.defaultSource]
        ? preferences.defaultSource
        : (CHAMPION_DATA_SOURCE_ORDER.find((source) => preferences.enabled[source]) ?? null)
  }))
