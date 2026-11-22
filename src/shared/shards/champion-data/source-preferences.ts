import {
  CHAMPION_DATA_SOURCE_ORDER,
  type ChampionDataSourcePreferences
} from '@shared/types/champion-data'
import { z } from 'zod'

import type { FeatureGateEvaluationResult } from '../feature-gating'

export function isChampionDataSourceAllowed(evaluation: FeatureGateEvaluationResult) {
  // Missing snapshots and unconfigured keys both leave these sources available.
  return !evaluation.configured || evaluation.enabled
}

export function createChampionDataSourcePreferences(): ChampionDataSourcePreferences {
  return { enabled: { opgg: true, qq101: true }, defaultSource: 'opgg' }
}

export const championDataSourcePreferencesSchema = z.object({
  enabled: z.object({ opgg: z.boolean(), qq101: z.boolean() }),
  defaultSource: z.enum(CHAMPION_DATA_SOURCE_ORDER).nullable()
})
