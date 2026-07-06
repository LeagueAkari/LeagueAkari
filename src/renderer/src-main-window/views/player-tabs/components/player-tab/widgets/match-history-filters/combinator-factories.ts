import {
  AllCombinator,
  AlliesCombinator,
  AndCombinator,
  AnyoneCombinator,
  AssistsBetweenCombinator,
  CombinatorArgNodeRef,
  DeathsBetweenCombinator,
  DurationBetweenCombinator,
  EnemiesCombinator,
  EveryoneCombinator,
  GoldBetweenCombinator,
  HasAugmentCombinator,
  HasItemCombinator,
  HasPerkCombinator,
  HasPerkStyleCombinator,
  HasPlayerCombinator,
  HasSpellCombinator,
  IsAbortCombinator,
  IsChampionCombinator,
  IsGameModeCombinator,
  IsLossCombinator,
  IsMapCombinator,
  IsMatchedGameCombinator,
  IsPositionCombinator,
  IsPveGameCombinator,
  IsQueueCombinator,
  IsRemakeCombinator,
  IsWinCombinator,
  KdaBetweenCombinator,
  KillsBetweenCombinator,
  NonNullCombinatorArgNodeRef,
  NotCombinator,
  NumberBetweenCombinator,
  NumberBetweenMeasureMode,
  OrCombinator,
  PlayerCombinator,
  nodeArg,
  paramArg
} from './combinator-nodes'

export function createAndCombinator(
  parentId: string,
  options?: {
    args?: NonNullCombinatorArgNodeRef[]
  }
): AndCombinator {
  return {
    id: `and-${crypto.randomUUID()}`,
    type: 'and',
    args: options?.args ?? [],
    parentId,
    argDeleteStrategy: 'remove-from-array'
  }
}

export function createOrCombinator(
  parentId: string,
  options?: {
    args?: NonNullCombinatorArgNodeRef[]
  }
): OrCombinator {
  return {
    id: `or-${crypto.randomUUID()}`,
    type: 'or',
    args: options?.args ?? [],
    parentId,
    argDeleteStrategy: 'remove-from-array'
  }
}

export function createNotCombinator(
  parentId: string,
  options?: {
    arg?: CombinatorArgNodeRef
  }
): NotCombinator {
  return {
    id: `not-${crypto.randomUUID()}`,
    type: 'not',
    args: [options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createIsAbortCombinator(parentId: string, _options?: unknown): IsAbortCombinator {
  return {
    id: `isAbort-${crypto.randomUUID()}`,
    type: 'isAbort',
    args: [],
    parentId
  }
}

export function createIsRemakeCombinator(parentId: string, _options?: unknown): IsRemakeCombinator {
  return {
    id: `isRemake-${crypto.randomUUID()}`,
    type: 'isRemake',
    args: [],
    parentId
  }
}

export function createIsWinCombinator(parentId: string, _options?: unknown): IsWinCombinator {
  return {
    id: `isWin-${crypto.randomUUID()}`,
    type: 'isWin',
    args: [],
    parentId
  }
}

export function createIsLossCombinator(
  parentId: string,
  options?: {
    isSurrender?: boolean
  }
): IsLossCombinator {
  return {
    id: `isLoss-${crypto.randomUUID()}`,
    type: 'isLoss',
    args: [paramArg(options?.isSurrender ?? false)],
    parentId
  }
}

export function createHasAugmentCombinator(
  parentId: string,
  options?: {
    augmentId?: number | null
    order?: number
  }
): HasAugmentCombinator {
  return {
    id: `hasAugment-${crypto.randomUUID()}`,
    type: 'hasAugment',
    args: [paramArg(options?.augmentId ?? null), paramArg(options?.order ?? -1)],
    parentId
  }
}

export function createHasPerkCombinator(
  parentId: string,
  options?: {
    perkId?: number
    order?: number
  }
): HasPerkCombinator {
  return {
    id: `hasPerk-${crypto.randomUUID()}`,
    type: 'hasPerk',
    args: [paramArg(options?.perkId ?? 8005), paramArg(options?.order ?? -1)],
    parentId
  }
}

export function createHasPerkStyleCombinator(
  parentId: string,
  options?: {
    perkStyleId?: number
    order?: number
  }
): HasPerkStyleCombinator {
  return {
    id: `hasPerkStyle-${crypto.randomUUID()}`,
    type: 'hasPerkStyle',
    args: [paramArg(options?.perkStyleId ?? 8000), paramArg(options?.order ?? -1)],
    parentId
  }
}

export function createHasSpellCombinator(
  parentId: string,
  options?: {
    spellId?: number
    order?: number
  }
): HasSpellCombinator {
  return {
    id: `hasSpell-${crypto.randomUUID()}`,
    type: 'hasSpell',
    args: [paramArg(options?.spellId ?? 4), paramArg(options?.order ?? -1)],
    parentId
  }
}

export function createHasItemCombinator(
  parentId: string,
  options?: {
    itemId?: number
    order?: number
  }
): HasItemCombinator {
  return {
    id: `hasItem-${crypto.randomUUID()}`,
    type: 'hasItem',
    args: [paramArg(options?.itemId ?? 3031), paramArg(options?.order ?? -1)],
    parentId
  }
}

export function createEnemiesCombinator(
  parentId: string,
  options?: {
    puuid?: string | null
    arg?: CombinatorArgNodeRef
  }
): EnemiesCombinator {
  return {
    id: `enemies-${crypto.randomUUID()}`,
    type: 'enemies',
    args: [paramArg(options?.puuid ?? null), options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createAlliesCombinator(
  parentId: string,
  options?: {
    puuid?: string | null
    arg?: CombinatorArgNodeRef
  }
): AlliesCombinator {
  return {
    id: `allies-${crypto.randomUUID()}`,
    type: 'allies',
    args: [paramArg(options?.puuid ?? null), options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createAllCombinator(
  parentId: string,
  options?: {
    arg?: CombinatorArgNodeRef
  }
): AllCombinator {
  return {
    id: `all-${crypto.randomUUID()}`,
    type: 'all',
    args: [options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createAnyoneCombinator(
  parentId: string,
  options?: {
    arg?: CombinatorArgNodeRef
  }
): AnyoneCombinator {
  return {
    id: `anyone-${crypto.randomUUID()}`,
    type: 'anyone',
    args: [options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createEveryoneCombinator(
  parentId: string,
  options?: {
    arg?: CombinatorArgNodeRef
  }
): EveryoneCombinator {
  return {
    id: `everyone-${crypto.randomUUID()}`,
    type: 'everyone',
    args: [options?.arg ?? nodeArg(null)],
    parentId
  }
}

export function createIsChampionCombinator(
  parentId: string,
  options?: {
    championId?: number
  }
): IsChampionCombinator {
  return {
    id: `isChampion-${crypto.randomUUID()}`,
    type: 'isChampion',
    args: [paramArg(options?.championId ?? 893)],
    parentId
  }
}

export function createIsPositionCombinator(
  parentId: string,
  options?: {
    position?: string
  }
): IsPositionCombinator {
  return {
    id: `isPosition-${crypto.randomUUID()}`,
    type: 'isPosition',
    args: [paramArg(options?.position ?? 'TOP')],
    parentId
  }
}

export function createIsQueueCombinator(
  parentId: string,
  options?: {
    queueId?: number
  }
): IsQueueCombinator {
  return {
    id: `isQueue-${crypto.randomUUID()}`,
    type: 'isQueue',
    args: [paramArg(options?.queueId ?? 450)],
    parentId
  }
}

export function createIsGameModeCombinator(
  parentId: string,
  options?: {
    gameMode?: string
  }
): IsGameModeCombinator {
  return {
    id: `isGameMode-${crypto.randomUUID()}`,
    type: 'isGameMode',
    args: [paramArg(options?.gameMode ?? 'CLASSIC')],
    parentId
  }
}

export function createIsMapCombinator(
  parentId: string,
  options?: {
    mapId?: number
  }
): IsMapCombinator {
  return {
    id: `isMap-${crypto.randomUUID()}`,
    type: 'isMap',
    args: [paramArg(options?.mapId ?? 11)],
    parentId
  }
}

export function createDurationBetweenCombinator(
  parentId: string,
  options?: {
    minSeconds?: number
    maxSeconds?: number
  }
): DurationBetweenCombinator {
  return {
    id: `durationBetween-${crypto.randomUUID()}`,
    type: 'durationBetween',
    args: [paramArg(options?.minSeconds ?? 0), paramArg(options?.maxSeconds ?? 999999)],
    parentId
  }
}

function createNumberBetweenCombinator<T extends string>(
  type: T,
  parentId: string,
  options?: {
    mode?: NumberBetweenMeasureMode
    min?: number
    max?: number
  },
  defaults: {
    min: number
    max: number
    withMeasureMode?: boolean
  } = { min: 0, max: 999999 }
): NumberBetweenCombinator<T> {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    args: defaults.withMeasureMode
      ? [
          paramArg(options?.mode ?? 'value'),
          paramArg(options?.min ?? defaults.min),
          paramArg(options?.max ?? defaults.max)
        ]
      : [paramArg(options?.min ?? defaults.min), paramArg(options?.max ?? defaults.max)],
    parentId
  }
}

export function createKdaBetweenCombinator(
  parentId: string,
  options?: {
    minKda?: number
    maxKda?: number
  }
): KdaBetweenCombinator {
  return {
    id: `kdaBetween-${crypto.randomUUID()}`,
    type: 'kdaBetween',
    args: [paramArg(options?.minKda ?? 0), paramArg(options?.maxKda ?? 999)],
    parentId
  }
}

export function createLevelBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('levelBetween', parentId, options, { min: 1, max: 18 })
}

export function createCsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('csBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createKillParticipationBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('killParticipationBetween', parentId, options, {
    min: 0,
    max: 100
  })
}

export function createDamageDealtToChampionsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('damageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createPhysicalDamageDealtToChampionsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('physicalDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createMagicDamageDealtToChampionsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('magicDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createTrueDamageDealtToChampionsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('trueDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createDamageTakenBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('damageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createPhysicalDamageTakenBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('physicalDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createMagicDamageTakenBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('magicDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createTrueDamageTakenBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('trueDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createGoldSpentBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('goldSpentBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createDamageToTowersBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('damageToTowersBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createHealBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('healBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createVisionScoreBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('visionScoreBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createTimeCCingOthersBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('timeCCingOthersBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })
}

export function createDgrBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('dgrBetween', parentId, options, { min: 0, max: 500 })
}

export function createSoloKillsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('soloKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })
}

export function createDoubleKillsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('doubleKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })
}

export function createTripleKillsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('tripleKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })
}

export function createQuadraKillsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('quadraKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })
}

export function createPentaKillsBetweenCombinator(
  parentId: string,
  options?: {
    min?: number
    max?: number
  }
) {
  return createNumberBetweenCombinator('pentaKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })
}

export function createKillsBetweenCombinator(
  parentId: string,
  options?: {
    mode?: NumberBetweenMeasureMode
    minKills?: number
    maxKills?: number
  }
): KillsBetweenCombinator {
  return createNumberBetweenCombinator(
    'killsBetween',
    parentId,
    { mode: options?.mode, min: options?.minKills, max: options?.maxKills },
    { min: 0, max: 999, withMeasureMode: true }
  )
}

export function createDeathsBetweenCombinator(
  parentId: string,
  options?: {
    mode?: NumberBetweenMeasureMode
    minDeaths?: number
    maxDeaths?: number
  }
): DeathsBetweenCombinator {
  return createNumberBetweenCombinator(
    'deathsBetween',
    parentId,
    { mode: options?.mode, min: options?.minDeaths, max: options?.maxDeaths },
    { min: 0, max: 999, withMeasureMode: true }
  )
}

export function createAssistsBetweenCombinator(
  parentId: string,
  options?: {
    mode?: NumberBetweenMeasureMode
    minAssists?: number
    maxAssists?: number
  }
): AssistsBetweenCombinator {
  return createNumberBetweenCombinator(
    'assistsBetween',
    parentId,
    { mode: options?.mode, min: options?.minAssists, max: options?.maxAssists },
    { min: 0, max: 999, withMeasureMode: true }
  )
}

export function createGoldBetweenCombinator(
  parentId: string,
  options?: {
    mode?: NumberBetweenMeasureMode
    minGold?: number
    maxGold?: number
  }
): GoldBetweenCombinator {
  return createNumberBetweenCombinator(
    'goldBetween',
    parentId,
    { mode: options?.mode, min: options?.minGold, max: options?.maxGold },
    { min: 0, max: 999999, withMeasureMode: true }
  )
}

export function createPlayerCombinator(
  parentId: string,
  options?: {
    puuid?: string | null
  }
): PlayerCombinator {
  return {
    id: `player-${crypto.randomUUID()}`,
    type: 'player',
    args: [paramArg(options?.puuid ?? null), nodeArg(null)],
    parentId
  }
}

export function createHasPlayerCombinator(
  parentId: string,
  options?: {
    puuid?: string | null
  }
): HasPlayerCombinator {
  return {
    id: `hasPlayer-${crypto.randomUUID()}`,
    type: 'hasPlayer',
    args: [paramArg(options?.puuid ?? null)],
    parentId
  }
}
export function createIsMatchedGameCombinator(
  parentId: string,
  _options?: unknown
): IsMatchedGameCombinator {
  return {
    id: `isMatchedGame-${crypto.randomUUID()}`,
    type: 'isMatchedGame',
    args: [],
    parentId
  }
}

export function createIsPveGameCombinator(
  parentId: string,
  _options?: unknown
): IsPveGameCombinator {
  return {
    id: `isPveGame-${crypto.randomUUID()}`,
    type: 'isPveGame',
    args: [],
    parentId
  }
}
