import type {
  OpggChampionDataMode,
  OpggRankedPosition,
  OpggRegion,
  OpggTierFilter
} from '@shared/types/opgg'

export const CHAMPION_DATA_OPGG_FEATURE_GATE = 'champion-data.opgg'
export const CHAMPION_DATA_QQ101_FEATURE_GATE = 'champion-data.qq101'

export const CHAMPION_DATA_SOURCE_ORDER = ['opgg', 'qq101'] as const

export type ChampionDataSourceId = (typeof CHAMPION_DATA_SOURCE_ORDER)[number]

export interface ChampionDataSourcePreferences {
  enabled: Record<ChampionDataSourceId, boolean>
  defaultSource: ChampionDataSourceId | null
}

export interface OpggChampionDataPreferences {
  mode: OpggChampionDataMode
  position: OpggRankedPosition
  region: OpggRegion
  tier: OpggTierFilter
}

export type Qq101ChampionDataMode = 'ranked' | 'classic' | 'aram' | 'aram_mayhem'
export type Qq101ChampionDataPosition = 'all' | 'top' | 'jungle' | 'middle' | 'bottom' | 'utility'

export interface Qq101ChampionDataPreferences {
  mode: Qq101ChampionDataMode
  position: Qq101ChampionDataPosition
  patch: string | null
  tier: number
}
