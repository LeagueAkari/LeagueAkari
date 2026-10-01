import type { OpggChampionPosition, OpggChampionRole, OpggChampionTierData } from './common'

export interface OpggWinRateChampionStats {
  play: number
  win_rate: number
  pick_rate: number
  ban_rate: number | null
  kda: number
  tier: number
  rank: number
  tier_data: OpggChampionTierData
  win?: never
  total_place?: never
  first_place?: never
  kills?: never
  assists?: never
  deaths?: never
}

export interface OpggArenaChampionStats {
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
  ban_rate: number
  kills: number
  assists: number
  deaths: number
  tier: number
  rank: number
  tier_data: OpggChampionTierData
  win_rate?: never
  kda?: never
}

interface OpggChampionOverviewBase {
  id: number
  is_rotation: boolean
  is_rip: boolean
}

export interface OpggRankedChampionOverview extends OpggChampionOverviewBase {
  average_stats: OpggWinRateChampionStats | null
  positions: OpggChampionPosition[]
  roles: OpggChampionRole[]
}

export interface OpggAramChampionOverview extends OpggChampionOverviewBase {
  average_stats: OpggWinRateChampionStats | null
  positions: null
  roles: OpggChampionRole[]
}

export interface OpggNexusBlitzChampionOverview extends OpggChampionOverviewBase {
  average_stats: OpggWinRateChampionStats | null
  positions: null
  roles: OpggChampionRole[]
}

export interface OpggUrfChampionOverview extends OpggChampionOverviewBase {
  average_stats: OpggWinRateChampionStats | null
  positions: null
  roles: OpggChampionRole[]
}

export interface OpggArenaChampionOverview extends OpggChampionOverviewBase {
  average_stats: OpggArenaChampionStats | null
  positions?: never
  roles?: never
}

export type OpggChampionOverview =
  | OpggRankedChampionOverview
  | OpggAramChampionOverview
  | OpggArenaChampionOverview
  | OpggNexusBlitzChampionOverview
  | OpggUrfChampionOverview

export interface OpggAnalyzedChampionOverviewMeta {
  version: string
  cached_at: string
  match_count: number
  analyzed_at: string
}

export interface OpggArenaChampionOverviewMeta {
  version: string
  cached_at: string
}

export interface OpggRankedChampionsResponse {
  data: OpggRankedChampionOverview[]
  meta: OpggAnalyzedChampionOverviewMeta
}

export interface OpggAramChampionsResponse {
  data: OpggAramChampionOverview[]
  meta: OpggAnalyzedChampionOverviewMeta
}

export interface OpggArenaChampionsResponse {
  data: OpggArenaChampionOverview[]
  meta: OpggArenaChampionOverviewMeta
}

export interface OpggNexusBlitzChampionsResponse {
  data: OpggNexusBlitzChampionOverview[]
  meta: OpggAnalyzedChampionOverviewMeta
}

export interface OpggUrfChampionsResponse {
  data: OpggUrfChampionOverview[]
  meta: OpggAnalyzedChampionOverviewMeta
}

export type OpggChampionOverviewResponse =
  | OpggRankedChampionsResponse
  | OpggAramChampionsResponse
  | OpggArenaChampionsResponse
  | OpggNexusBlitzChampionsResponse
  | OpggUrfChampionsResponse

export interface OpggChampionVersionsResponse {
  data: string[]
}
