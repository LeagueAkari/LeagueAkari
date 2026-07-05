export const ONGOING_GAME_PLAYER_RELOAD_SCOPES = [
  'matchHistory',
  'summoner',
  'rankedStats',
  'savedInfo',
  'championMastery'
] as const

export type OngoingGamePlayerReloadScope = (typeof ONGOING_GAME_PLAYER_RELOAD_SCOPES)[number]

export type OngoingGamePlayerReloadOptions =
  | {
      includes?: OngoingGamePlayerReloadScope[]
      excludes?: never
    }
  | {
      includes?: never
      excludes?: OngoingGamePlayerReloadScope[]
    }

export function resolveOngoingGamePlayerReloadScopes(
  options: OngoingGamePlayerReloadOptions = {}
): OngoingGamePlayerReloadScope[] {
  const hasIncludes = options.includes !== undefined
  const hasExcludes = options.excludes !== undefined

  if (hasIncludes && hasExcludes) {
    throw new Error('includes and excludes cannot be used together')
  }

  if (hasIncludes) {
    return [...new Set(options.includes)]
  }

  if (hasExcludes) {
    const excludedScopes = new Set(options.excludes)
    return ONGOING_GAME_PLAYER_RELOAD_SCOPES.filter((scope) => !excludedScopes.has(scope))
  }

  return [...ONGOING_GAME_PLAYER_RELOAD_SCOPES]
}
