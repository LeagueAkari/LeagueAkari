/** OP.GG response contract. Last verified against live endpoints: 2026-11-15. */
import type {
  OpggAramChampionOverview,
  OpggArenaChampionOverview,
  OpggDoomChampionOverview,
  OpggNexusBlitzChampionOverview,
  OpggRankedChampionOverview,
  OpggUrfChampionOverview
} from './champion-overview'
import type { OpggChampionCounter, OpggSkillCode } from './common'

interface OpggPickStats {
  play: number
  win: number
  pick_rate: number
}

export interface OpggItemBuild extends OpggPickStats {
  ids: number[]
}

export interface OpggItemBuildGroup {
  depth: number
  items: OpggItemBuild[]
}

export interface OpggArenaItemBuild extends OpggItemBuild {
  total_place: number
  first_place: number
}

export interface OpggSummonerSpellBuild extends OpggPickStats {
  ids: [number, number]
}

export interface OpggMythicItemGroup extends OpggPickStats {
  id: number
  builds: OpggItemBuild[]
}

export interface OpggSkillOrder extends OpggPickStats {
  order: OpggSkillCode[]
}

export interface OpggArenaSkillOrder extends OpggSkillOrder {
  total_place: number
  first_place: number
}

export interface OpggSkillEvolution extends OpggPickStats {
  ids: OpggSkillCode[]
}

export interface OpggSkillMastery extends OpggPickStats {
  ids: OpggSkillCode[]
  builds: OpggSkillOrder[]
}

export interface OpggArenaSkillMastery extends OpggSkillMastery {
  total_place: number
  first_place: number
}

export interface OpggRuneBuild extends OpggPickStats {
  id: number
  primary_page_id: number
  primary_rune_ids: number[]
  secondary_page_id: number
  secondary_rune_ids: number[]
  stat_mod_ids: number[]
}

export interface OpggRunePage extends OpggPickStats {
  id: number
  primary_page_id: number
  secondary_page_id: number
  builds: OpggRuneBuild[]
}

export interface OpggSingleRuneStats extends OpggPickStats {
  id: number
}

export interface OpggSingleRunes {
  primary_page: { runes: OpggSingleRuneStats[] }
  secondary_page: { runes: OpggSingleRuneStats[] }
  stat_mod_one: { runes: OpggSingleRuneStats[] }
  stat_mod_two: { runes: OpggSingleRuneStats[] }
  stat_mod_three: { runes: OpggSingleRuneStats[] }
}

export interface OpggGameLengthStats {
  game_length: number
  rate: number | null
  average: number
  rank: number | null
}

export interface OpggChampionTrendPoint {
  version: string
  rate: number
  rank: number | null
  created_at: string
}

export interface OpggChampionTrends {
  total_rank: number
  total_position_rank: number
  win: OpggChampionTrendPoint[]
  pick: OpggChampionTrendPoint[]
  ban: OpggChampionTrendPoint[]
}

export interface OpggArenaAugmentGroup {
  rarity: 1 | 4 | 8
  augments: OpggArenaAugment[]
}

export interface OpggArenaAugment extends OpggPickStats {
  id: number
  total_place: number
  first_place: number
  win_rate: number
}

export interface OpggArenaSynergy extends OpggPickStats {
  champion_id: number
  op_rank: number
  total_place: number
  first_place: number
}

interface OpggWinRateChampionDetailsFields {
  summoner_spells: OpggSummonerSpellBuild[]
  core_items: OpggItemBuild[]
  mythic_items: OpggMythicItemGroup[]
  boots: OpggItemBuild[]
  starter_items: OpggItemBuild[]
  last_items: OpggItemBuild[]
  rune_pages: OpggRunePage[]
  runes: OpggRuneBuild[]
  skill_masteries: OpggSkillMastery[]
  skills: OpggSkillOrder[]
  skill_evolves: OpggSkillEvolution[]
  trends: OpggChampionTrends
  game_lengths: OpggGameLengthStats[]
  counters: OpggChampionCounter[]
}

export interface OpggRankedChampionBasicDetails extends OpggWinRateChampionDetailsFields {
  summary: OpggRankedChampionOverview
}

/** Verified 2026-11-15: is_more=true adds item progression and individual rune statistics together. */
export interface OpggRankedChampionExtendedDetails extends OpggRankedChampionBasicDetails {
  single_items: OpggItemBuildGroup[]
  combination_items: OpggItemBuildGroup[]
  single_runes: OpggSingleRunes
}

export type OpggRankedChampionDetails =
  OpggRankedChampionBasicDetails | OpggRankedChampionExtendedDetails

export interface OpggAramChampionDetails extends OpggWinRateChampionDetailsFields {
  summary: OpggAramChampionOverview
}

export interface OpggNexusBlitzChampionDetails extends OpggWinRateChampionDetailsFields {
  summary: OpggNexusBlitzChampionOverview
}

export interface OpggUrfChampionDetails extends OpggWinRateChampionDetailsFields {
  summary: OpggUrfChampionOverview
}

/** Verified 2026-11-15: Doom has no trend series; the wire value is null. */
export interface OpggDoomChampionDetails extends Omit<OpggWinRateChampionDetailsFields, 'trends'> {
  summary: OpggDoomChampionOverview
  trends: null
}

export interface OpggArenaChampionDetails {
  summary: OpggArenaChampionOverview
  core_items: OpggArenaItemBuild[]
  boots: OpggArenaItemBuild[]
  starter_items: OpggArenaItemBuild[]
  last_items: OpggArenaItemBuild[]
  prism_items: OpggArenaItemBuild[]
  skill_masteries: OpggArenaSkillMastery[]
  skills: OpggArenaSkillOrder[]
  skill_evolves: OpggSkillEvolution[]
  augment_group: OpggArenaAugmentGroup[]
  synergies: OpggArenaSynergy[]
}

export interface OpggChampionDetailsMeta {
  version: string
  cached_at: string
}

export interface OpggRankedChampionDetailsResponse {
  data: OpggRankedChampionDetails
  meta: OpggChampionDetailsMeta
}

export interface OpggRankedChampionExtendedDetailsResponse extends OpggRankedChampionDetailsResponse {
  data: OpggRankedChampionExtendedDetails
}

export interface OpggRankedChampionCountersResponse {
  data: OpggChampionCounter[]
  meta: OpggChampionDetailsMeta
}

export interface OpggAramChampionDetailsResponse {
  data: OpggAramChampionDetails
  meta: OpggChampionDetailsMeta
}

export interface OpggArenaChampionDetailsResponse {
  data: OpggArenaChampionDetails
  meta: OpggChampionDetailsMeta
}

export interface OpggNexusBlitzChampionDetailsResponse {
  data: OpggNexusBlitzChampionDetails
  meta: OpggChampionDetailsMeta
}

export interface OpggUrfChampionDetailsResponse {
  data: OpggUrfChampionDetails
  meta: OpggChampionDetailsMeta
}

export interface OpggDoomChampionDetailsResponse {
  data: OpggDoomChampionDetails
  meta: OpggChampionDetailsMeta
}

export type OpggChampionDetailsResponse =
  | OpggRankedChampionDetailsResponse
  | OpggAramChampionDetailsResponse
  | OpggArenaChampionDetailsResponse
  | OpggNexusBlitzChampionDetailsResponse
  | OpggUrfChampionDetailsResponse
  | OpggDoomChampionDetailsResponse
