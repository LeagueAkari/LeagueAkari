// 平衡性
export interface OpggAramBalanceResponse {
  data: OpggAramBalanceItem[]
}

export interface OpggAramBalanceItem {
  champion_id: number
  attack_speed: number
  damage_dealt: number
  damage_taken: number
  cooldown_reduction: number
  healing: number
  tenacity: number
  shield_amount: number
  energy_regen: number
  area_of_effect_damage: number
  default: boolean
}

// 海克斯乱斗分段梯度
export interface OpggAramMayhemTierResponse {
  data: OpggAramMayhemTierItem[]
}

export interface OpggAramMayhemTierItem {
  champion_id: number
  id: number
  tier: number
  rank: number
}

// 模式英雄榜
export interface OpggChampionsResponse {
  data: OpggChampionItem[]
  meta: OpggChampionsResponseMeta
}

export interface OpggChampionItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggChampionAverageStats
  positions?: OpggChampionPosition[] | null
  roles?: OpggChampionRole[]
}

export interface OpggChampionAverageStats {
  play: number
  win_rate?: number
  pick_rate: number
  ban_rate: number | null
  kda?: number
  tier?: number
  rank?: number
  tier_data: OpggChampionTierData
  role_rate?: number
  win?: number
  total_place?: number
  first_place?: number
  kills?: number
  assists?: number
  deaths?: number
}

export interface OpggChampionTierData {
  tier: number
  rank: number
  rank_prev: number
  rank_prev_patch: number | null
}

export interface OpggChampionPosition {
  name: OpggChampionPositionName
  stats: OpggChampionPositionStats
  roles: OpggChampionRole[]
  counters: OpggChampionCounter[]
}

export interface OpggChampionPositionStats {
  play: number
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: OpggChampionTierData
  total_place: never
  first_place: never
}

export enum OpggChampionPositionName {
  ADC = 'ADC',
  Jungle = 'JUNGLE',
  Mid = 'MID',
  Support = 'SUPPORT',
  Top = 'TOP'
}

export interface OpggChampionCounter {
  champion_id: number
  play: number
  win: number
}

export interface OpggChampionRole {
  name: OpggChampionRoleName
  stats: OpggChampionRoleStats
}

export enum OpggChampionRoleName {
  Controller = 'CONTROLLER',
  Fighter = 'FIGHTER',
  FighterAssassin = 'FIGHTER|ASSASSIN',
  FighterSlayer = 'FIGHTER|SLAYER',
  Mage = 'MAGE',
  Marksman = 'MARKSMAN',
  MarksmanAssassin = 'MARKSMAN|ASSASSIN',
  Slayer = 'SLAYER',
  SlayerAssassin = 'SLAYER|ASSASSIN',
  SlayerSlayer = 'SLAYER|SLAYER',
  Tank = 'TANK',
  TankSlayer = 'TANK|SLAYER'
}

export interface OpggChampionRoleStats {
  win_rate: number
  role_rate: number
  play: number
  win: number
}

export interface OpggChampionsResponseMeta {
  version: string
  cached_at: Date
  match_count?: number
  analyzed_at?: Date
}

export interface OpggChampionBuildResponse {
  data: OpggChampionBuildData
  meta: OpggChampionBuildMeta
}

export interface OpggChampionBuildData {
  summary: OpggChampionBuildSummary
  summoner_spells?: OpggBuildPickItem[]
  core_items: OpggBuildPickItem[]
  mythic_items?: OpggBuildPickItem[]
  boots: OpggBuildPickItem[]
  starter_items: OpggBuildPickItem[]
  last_items: OpggBuildPickItem[]
  rune_pages?: OpggRunePage[]
  runes?: OpggRuneBuild[]
  skill_masteries: OpggSkillMastery[]
  skills: OpggBuildPickItem[]
  skill_evolves: OpggBuildPickItem[]
  trends?: OpggChampionTrends
  game_lengths?: OpggGameLength[]
  counters?: OpggChampionCounter[]
  prism_items?: OpggBuildPickItem[]
  augment_group?: OpggArenaAugmentGroup[]
  synergies?: OpggArenaSynergy[]
}

export interface OpggBuildPickItem {
  ids: number[]
  win: number
  play: number
  pick_rate: number
  order?: OpggSkillKey[]
  total_place?: number
  first_place?: number
}

export enum OpggSkillKey {
  Q = 'Q',
  W = 'W',
  E = 'E',
  R = 'R',
  'R-Q' = 'R-Q',
  'R-W' = 'R-W',
  'R-E' = 'R-E',
  'R-R' = 'R-R'
}

export interface OpggGameLength {
  game_length: number
  rate: number | null
  average: number
  rank: number | null
}

export interface OpggRunePage {
  id: number
  primary_page_id: number
  secondary_page_id: number
  play: number
  win: number
  pick_rate: number
  builds: OpggRuneBuild[]
}

export interface OpggRuneBuild {
  id: number
  primary_page_id: number
  primary_rune_ids: number[]
  secondary_page_id: number
  secondary_rune_ids: number[]
  stat_mod_ids: number[]
  play: number
  win: number
  pick_rate: number
}

export interface OpggSkillMastery {
  ids: OpggSkillKey[]
  play: number
  win: number
  pick_rate: number
  builds: OpggBuildPickItem[]
  total_place?: number
  first_place?: number
}

export interface OpggChampionBuildSummary {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: OpggChampionAverageStats
  positions: OpggChampionPosition[] | null
  roles: OpggChampionRole[]
}

export interface OpggChampionTrends {
  total_rank: number
  total_position_rank: number
  win: OpggTrendPoint[]
  pick: OpggTrendPoint[]
  ban: OpggTrendPoint[]
}

export interface OpggTrendPoint {
  version: string
  rate: number
  rank: number | null
  created_at: Date
}

export interface OpggChampionBuildMeta {
  version: string
  cached_at: Date
}

export type ModeType = 'aram' | 'arena' | 'nexus_blitz' | 'urf' | 'ranked' | (string & {})

export type PositionType =
  | 'mid'
  | 'jungle'
  | 'adc'
  | 'top'
  | 'support'
  | 'all'
  | 'none'
  | (string & {})

export type TierType =
  | 'all'
  | 'ibsg' // Iron, Bronze, Silver, Gold
  | 'gold_plus'
  | 'platinum_plus'
  | 'emerald_plus'
  | 'diamond_plus'
  | 'master'
  | 'master_plus'
  | 'grandmaster'
  | 'challenger'
  | (string & {})

export type RegionType =
  | 'global'
  | 'na'
  | 'euw'
  | 'kr'
  | 'br'
  | 'eune'
  | 'jp'
  | 'lan'
  | 'las'
  | 'oce'
  | 'tr'
  | 'ru'
  | 'sg'
  | 'id'
  | 'ph'
  | 'th'
  | 'vn'
  | 'tw'
  | 'me'
  | (string & {})

export interface OpggVersionsResponse {
  data: string[]
}

export interface OpggArenaAugmentGroup {
  rarity: number
  augments: OpggArenaAugment[]
}

export interface OpggArenaSynergy {
  champion_id: number
  op_rank: number
  play: number
  win: number
  total_place: number
  first_place: number
  pick_rate: number
}

export interface OpggArenaAugment {
  id: number
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
}

export interface OpggAramMayhemChampionAugmentsResponse {
  data: OpggAramMayhemChampionAugmentItem[]
}

export interface OpggAramMayhemChampionAugmentItem {
  id: number
  tier: number
  performance: number
  popular: number
}

export interface OpggTiersResponse {
  data: OpggTiersItem[]
}

export interface OpggTiersItem {
  champion_id: number
  id: number
  tier: number
  rank: number
}
