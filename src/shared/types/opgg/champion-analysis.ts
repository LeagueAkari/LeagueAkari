import type { OpggRankedChampionOverview } from './champion-overview'
import type { OpggChampionTierData, OpggPositionCode } from './common'

/** Champion analysis endpoints. Last verified against live responses: 2026-11-15. */
export interface OpggChampionAnalysisMeta {
  version: string
  cached_at: string
}

export interface OpggRankedChampionSummaryResponse {
  data: OpggRankedChampionOverview
  meta: OpggChampionAnalysisMeta
}

export interface OpggChampionMatchupStats {
  version: string
  champion_id: number
  win: number
  play: number

  counter_kill: number
  counter_death: number
  lane_kill: number
  lane_death: number
  kill: number
  assist: number
  death: number
  kill_contribution_rate: number

  damage_dealt_to_champions: number
  damage_taken: number
  first_lane_tower_kill_in_seconds: number
  total_lane_tower_kills: number
  lane_score: number
  turret_plate_destroy: number
  lane_solo_kill: number
  lane_duo_kill: number
}

export interface OpggChampionMatchupResponse {
  /** Both champions' aggregate statistics, identified by champion_id. */
  data: OpggChampionMatchupStats[]
  meta: OpggChampionAnalysisMeta
}

export interface OpggChampionSynergy {
  champion_id: number
  position: OpggPositionCode
  synergy_champion_id: number
  synergy_position: OpggPositionCode
  score_rank: number
  score: number
  play: number
  win: number
  win_rate: number
  synergy_tier_data: OpggChampionTierData
}

export interface OpggChampionSynergiesResponse {
  data: OpggChampionSynergy[]
  meta: OpggChampionAnalysisMeta & { total_play: number }
}

export interface OpggTierStatistics {
  tier: string
  play: number
  win: number
  lose: number
  kill: number
  death: number
  assist: number
  cs: number
  neutral_cs: number
  gold: number
  ward: number
  game_duration: number
  damage_dealt_to_champions: number
  damage_taken: number
  op_score_point: number
  vision_score: number
  wards_killed: number
}

export interface OpggTierStatisticsResponse {
  data: OpggTierStatistics[]
  meta: OpggChampionAnalysisMeta
}
