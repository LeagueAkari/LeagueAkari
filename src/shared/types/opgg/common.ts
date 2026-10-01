export const OPGG_CHAMPION_DATA_MODES = [
  'ranked',
  'aram',
  'aram_mayhem',
  'arena',
  'nexus_blitz',
  'urf'
] as const

export const OPGG_CHAMPION_API_MODES = ['ranked', 'aram', 'arena', 'nexus_blitz', 'urf'] as const

export const OPGG_RANKED_POSITIONS = ['top', 'jungle', 'mid', 'adc', 'support'] as const

export const OPGG_REGIONS = [
  'global',
  'na',
  'euw',
  'kr',
  'br',
  'eune',
  'jp',
  'lan',
  'las',
  'oce',
  'tr',
  'ru',
  'sea',
  'sg',
  'ph',
  'th',
  'vn',
  'tw',
  'me'
] as const

export const OPGG_TIER_FILTERS = [
  'all',
  'ibsg',
  'gold_plus',
  'platinum_plus',
  'emerald_plus',
  'diamond_plus',
  'master',
  'master_plus',
  'grandmaster',
  'challenger'
] as const

export type OpggChampionDataMode = (typeof OPGG_CHAMPION_DATA_MODES)[number]
export type OpggChampionApiMode = (typeof OPGG_CHAMPION_API_MODES)[number]
export type OpggRankedPosition = (typeof OPGG_RANKED_POSITIONS)[number]
export type OpggRegion = (typeof OPGG_REGIONS)[number]
export type OpggTierFilter = (typeof OPGG_TIER_FILTERS)[number]

export type OpggPositionCode = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'

export type OpggRoleCode =
  | 'CONTROLLER'
  | 'FIGHTER'
  | 'FIGHTER|ASSASSIN'
  | 'FIGHTER|SLAYER'
  | 'MAGE'
  | 'MARKSMAN'
  | 'MARKSMAN|ASSASSIN'
  | 'SLAYER'
  | 'SLAYER|ASSASSIN'
  | 'SLAYER|SLAYER'
  | 'TANK'
  | 'TANK|SLAYER'

export type OpggSkillCode = 'Q' | 'W' | 'E' | 'R' | 'R-Q' | 'R-W' | 'R-E' | 'R-R'

export interface OpggChampionTierData {
  tier: number
  rank: number
  rank_prev: number | null
  rank_prev_patch: number | null
}

export interface OpggChampionCounter {
  champion_id: number
  play: number
  win: number
}

export interface OpggChampionRoleStats {
  win_rate: number
  role_rate: number
  play: number
  win: number
}

export interface OpggChampionRole {
  name: OpggRoleCode
  stats: OpggChampionRoleStats
}

export interface OpggChampionPositionStats {
  play: number
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: OpggChampionTierData
  total_place?: never
  first_place?: never
}

export interface OpggChampionPosition {
  name: OpggPositionCode
  stats: OpggChampionPositionStats
  roles: OpggChampionRole[]
  counters: OpggChampionCounter[]
}
