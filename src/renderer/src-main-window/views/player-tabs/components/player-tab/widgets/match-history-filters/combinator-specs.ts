export type CombinatorScope = 'game' | 'participant' | 'participants'

export type CombinatorSpec = {
  requireScopes: readonly CombinatorScope[]
  provideScope: CombinatorScope | null
}

export const COMBINATOR_SPECS = {
  game: {
    requireScopes: [],
    provideScope: 'game'
  },
  and: {
    requireScopes: ['game', 'participant', 'participants'],
    provideScope: null
  },
  or: {
    requireScopes: ['game', 'participant', 'participants'],
    provideScope: null
  },
  not: {
    requireScopes: ['game', 'participant', 'participants'],
    provideScope: null
  },
  isQueue: {
    requireScopes: ['game'],
    provideScope: null
  },
  isGameMode: {
    requireScopes: ['game'],
    provideScope: null
  },
  isMap: {
    requireScopes: ['game'],
    provideScope: null
  },
  isAbort: {
    requireScopes: ['game', 'participant', 'participants'],
    provideScope: null
  },
  isRemake: {
    requireScopes: ['game', 'participant', 'participants'],
    provideScope: null
  },
  hasAugment: {
    requireScopes: ['participant'],
    provideScope: null
  },
  hasPerk: {
    requireScopes: ['participant'],
    provideScope: null
  },
  hasPerkStyle: {
    requireScopes: ['participant'],
    provideScope: null
  },
  enemies: {
    requireScopes: ['game'],
    provideScope: 'participants'
  },
  allies: {
    requireScopes: ['game'],
    provideScope: 'participants'
  },
  all: {
    requireScopes: ['game'],
    provideScope: 'participants'
  },
  player: {
    requireScopes: ['game', 'participants'],
    provideScope: 'participant'
  },
  hasPlayer: {
    requireScopes: ['game', 'participants'],
    provideScope: null
  },
  anyone: {
    requireScopes: ['game', 'participants'],
    provideScope: 'participant'
  },
  everyone: {
    requireScopes: ['game', 'participants'],
    provideScope: 'participant'
  },
  hasSpell: {
    requireScopes: ['participant'],
    provideScope: null
  },
  isPosition: {
    requireScopes: ['participant'],
    provideScope: null
  },
  hasItem: {
    requireScopes: ['participant'],
    provideScope: null
  },
  isChampion: {
    requireScopes: ['participant'],
    provideScope: null
  },
  durationBetween: {
    requireScopes: ['game'],
    provideScope: null
  },
  kdaBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  killsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  deathsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  assistsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  goldBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  levelBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  csBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  killParticipationBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  damageDealtToChampionsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  physicalDamageDealtToChampionsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  magicDamageDealtToChampionsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  trueDamageDealtToChampionsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  damageTakenBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  physicalDamageTakenBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  magicDamageTakenBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  trueDamageTakenBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  goldSpentBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  damageToTowersBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  healBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  visionScoreBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  timeCCingOthersBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  dgrBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  soloKillsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  doubleKillsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  tripleKillsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  quadraKillsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  pentaKillsBetween: {
    requireScopes: ['participant'],
    provideScope: null
  },
  isWin: {
    requireScopes: ['participant', 'participants'],
    provideScope: null
  },
  isLoss: {
    requireScopes: ['participant', 'participants'],
    provideScope: null
  },
  isMatchedGame: {
    requireScopes: ['game'],
    provideScope: null
  },
  isPveGame: {
    requireScopes: ['game'],
    provideScope: null
  },
  gameCreationInTimeRange: {
    requireScopes: ['game'],
    provideScope: null
  }
} as const satisfies Record<string, CombinatorSpec>

export type CombinatorKey = keyof typeof COMBINATOR_SPECS

export const isCombinatorKey = (value: string): value is CombinatorKey => {
  return value in COMBINATOR_SPECS
}

export const getCombinatorSpec = (key: string): CombinatorSpec | null => {
  if (!isCombinatorKey(key)) {
    return null
  }

  return COMBINATOR_SPECS[key] as CombinatorSpec
}

export const getCombinatorProvideScope = (key: string): CombinatorScope | null => {
  return getCombinatorSpec(key)?.provideScope ?? null
}

export const isCombinatorAvailableInScope = (key: string, scope: string) => {
  return getCombinatorSpec(key)?.requireScopes.includes(scope as CombinatorScope) ?? false
}
