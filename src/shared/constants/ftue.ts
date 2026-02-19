export const FTUE_TARGET_ATTR = 'data-ftue-target'

export const FTUE_TARGET_JUNGLE_PATHING_ONGOING_GAME = 'jungle-pathing-ongoing-game'

export function getFtueTargetJunglePathingMatchHistory(gameId: number) {
  return `jungle-pathing-match-history-${gameId}`
}

export function getFtueTargetSelector(target: string) {
  return `[${FTUE_TARGET_ATTR}="${target}"]`
}
