export type AutoHonorStrategy =
  | 'prefer-lobby-member'
  | 'only-lobby-member'
  | 'all-member'
  | 'opt-out'
  | 'all-member-including-opponent'

export type AutoMatchmakingStrategy = 'never' | 'fixed-duration' | 'estimated-duration'
