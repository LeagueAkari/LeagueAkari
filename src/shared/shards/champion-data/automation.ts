import type { OpggRegion, OpggTierFilter } from '@shared/types/opgg'
import { OPGG_REGIONS, OPGG_TIER_FILTERS } from '@shared/types/opgg'
import { z } from 'zod'

export interface ChampionDataAutomationSettings {
  enabled: boolean
  opgg: { region: OpggRegion; tier: OpggTierFilter }
  qq101: { tier: number }
}

export function createChampionDataAutomationSettings(): ChampionDataAutomationSettings {
  return { enabled: false, opgg: { region: 'global', tier: 'all' }, qq101: { tier: 255 } }
}

export const championDataAutomationSettingsSchema = z.object({
  enabled: z.boolean(),
  opgg: z.object({ region: z.enum(OPGG_REGIONS), tier: z.enum(OPGG_TIER_FILTERS) }),
  qq101: z.object({ tier: z.number().int() })
})

export type CurrentGameUnavailableReason = 'waitingChampion' | 'missingPosition' | 'unsupportedMode'

/** The page still owns its query and requests; only its lifecycle belongs to the current game. */
export interface CurrentGamePage {
  unavailableReason: CurrentGameUnavailableReason | null
}
