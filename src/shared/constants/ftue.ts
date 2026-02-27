export const FTUE_TARGET_ATTR = 'data-ftue-target'

export const FTUE_TARGET_JUNGLE_PATHING_ONGOING_GAME = 'jungle-pathing-ongoing-game'
export const FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_AVATAR = 'match-history-hero-filter-avatar'
export const FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON = 'match-history-hero-filter-button'
export const FTUE_TARGET_ONGOING_GAME_HERO_FILTER_AVATAR = 'ongoing-game-hero-filter-avatar'
export const FTUE_TARGET_ONGOING_GAME_HERO_FILTER_BUTTON = 'ongoing-game-hero-filter-button'
export const FTUE_TARGET_THEME_SYSTEM_BUTTON = 'theme-system-button'

export function getFtueTargetJunglePathingMatchHistory(gameId: number) {
  return `jungle-pathing-match-history-${gameId}`
}

export function getFtueTargetSelector(target: string) {
  return `[${FTUE_TARGET_ATTR}="${target}"]`
}
