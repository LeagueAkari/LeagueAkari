/** OP.GG response contract. Last verified against live endpoints: 2026-11-15. */
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

export interface OpggAramMayhemTiersResponse {
  data: OpggAramMayhemTier[]
}

/** /contents/tiers without type is Brawl, not ARAM Mayhem. Verified: 2026-11-15. */
export interface OpggBrawlTiersResponse {
  data: OpggBrawlTier[]
}

export interface OpggBrawlTier {
  champion_id: number
  id: number
  tier: number
  rank: number
}

export interface OpggAramMayhemTier {
  champion_id: number
  id: number
  tier: number
  rank: number
}

export interface OpggAramMayhemChampionAugmentsResponse {
  data: OpggAramMayhemChampionAugment[]
}

export interface OpggAramMayhemChampionAugment {
  id: number
  tier: number | null
  performance: number
  popular: number
}
