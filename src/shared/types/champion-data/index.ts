import type {
  OpggChampionDataMode,
  OpggRankedPosition,
  OpggRegion,
  OpggTierFilter
} from '@shared/types/opgg'

export const CHAMPION_DATA_OPGG_FEATURE_GATE = 'champion-data.opgg'
export const CHAMPION_DATA_QQ101_FEATURE_GATE = 'champion-data.qq101'

export type ChampionDataSourceId = 'opgg' | 'qq101'

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
