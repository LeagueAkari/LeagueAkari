import type { ChampionRunesConfig, SummonerSpellsConfig } from '@shared/shards/auto-champ-config'
import type { ComputedRef } from 'vue'
import { z } from 'zod'

/** LCU values shared by every source. Null closes the managed page. */
export interface CurrentGameInput {
  readonly championId: number
  readonly assignedPosition: string
  readonly gameMode: string
  readonly queueType: string
  readonly queueId: number
}

type DataStatus =
  | 'idle'
  | 'loading'
  | 'empty'
  | 'loadError'
  | 'missingPosition'
  | 'unsupportedMode'
  | 'sourceUnavailable'

export type Recommendation<T> =
  { status: DataStatus; error?: string } | { status: 'ready'; value: T }

export interface RecommendedLoadout {
  /** Identifies the source query so changing preferences invalidates a pending write. */
  queryKey: string
  runes: Recommendation<ChampionRunesConfig>
  summonerSpells: Recommendation<SummonerSpellsConfig>
}

export type BindCurrentGameSource = (
  input: ComputedRef<CurrentGameInput | null>
) => () => RecommendedLoadout

export interface ChampionDataCommands {
  setRunes(config: ChampionRunesConfig, name: string): Promise<boolean>

  setSummonerSpells(config: SummonerSpellsConfig): Promise<SummonerSpellsConfig>
}

export function loadoutStatus(status: DataStatus, error?: string): RecommendedLoadout {
  return { queryKey: '', runes: { status, error }, summonerSpells: { status, error } }
}

export function recommended<T>(value: T | undefined): Recommendation<T> {
  return value ? { status: 'ready', value } : { status: 'empty' }
}

const id = z.number().int().positive()

export const runeSchema = z.object({
  primaryStyleId: id,
  subStyleId: id,
  selectedPerkIds: z.array(id).length(9)
})

export function isValidRunePage(value: ChampionRunesConfig): boolean {
  return runeSchema.safeParse(value).success
}

export function toSummonerSpellsConfig(ids: readonly number[]): SummonerSpellsConfig | undefined {
  const [spell1Id, spell2Id] = ids
  if (
    ids.length === 2 &&
    spell1Id !== spell2Id &&
    ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return { spell1Id, spell2Id }
  }

  return undefined
}
