export type AutoMiscRankedTier =
  | 'IRON'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'EMERALD'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER'
  | 'CHALLENGER'

export type AutoMiscRankedDivision = 'I' | 'II' | 'III' | 'IV'

export interface AutoMiscRankedStatus {
  queue: string
  tier: AutoMiscRankedTier
  division: AutoMiscRankedDivision
}
