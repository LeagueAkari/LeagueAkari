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

export const createAndCombinator = (
  parentId: string,
  options?: { args?: NonNullCombinatorArgNodeRef[] }
): AndCombinator => ({
  id: `and-${crypto.randomUUID()}`,
  type: 'and',
  args: options?.args ?? [],
  parentId,
  argDeleteStrategy: 'remove-from-array'
})

export const createOrCombinator = (
  parentId: string,
  options?: { args?: NonNullCombinatorArgNodeRef[] }
): OrCombinator => ({
  id: `or-${crypto.randomUUID()}`,
  type: 'or',
  args: options?.args ?? [],
  parentId,
  argDeleteStrategy: 'remove-from-array'
})

export const createNotCombinator = (
  parentId: string,
  options?: { arg?: CombinatorArgNodeRef }
): NotCombinator => ({
  id: `not-${crypto.randomUUID()}`,
  type: 'not',
  args: [options?.arg ?? nodeArg(null)],
  parentId
})

export const createIsAbortCombinator = (
  parentId: string,
  _options?: unknown
): IsAbortCombinator => ({
  id: `isAbort-${crypto.randomUUID()}`,
  type: 'isAbort',
  args: [],
  parentId
})

export const createIsRemakeCombinator = (
  parentId: string,
  _options?: unknown
): IsRemakeCombinator => ({
  id: `isRemake-${crypto.randomUUID()}`,
  type: 'isRemake',
  args: [],
  parentId
})

export const createIsWinCombinator = (parentId: string, _options?: unknown): IsWinCombinator => ({
  id: `isWin-${crypto.randomUUID()}`,
  type: 'isWin',
  args: [],
  parentId
})

export const createIsLossCombinator = (
  parentId: string,
  options?: { isSurrender?: boolean }
): IsLossCombinator => ({
  id: `isLoss-${crypto.randomUUID()}`,
  type: 'isLoss',
  args: [paramArg(options?.isSurrender ?? false)],
  parentId
})

export const createHasAugmentCombinator = (
  parentId: string,
  options?: { augmentId?: number | null; order?: number }
): HasAugmentCombinator => ({
  id: `hasAugment-${crypto.randomUUID()}`,
  type: 'hasAugment',
  args: [paramArg(options?.augmentId ?? null), paramArg(options?.order ?? -1)],
  parentId
})

export const createHasPerkCombinator = (
  parentId: string,
  options?: { perkId?: number; order?: number }
): HasPerkCombinator => ({
  id: `hasPerk-${crypto.randomUUID()}`,
  type: 'hasPerk',
  args: [paramArg(options?.perkId ?? 8005), paramArg(options?.order ?? -1)],
  parentId
})

export const createHasPerkStyleCombinator = (
  parentId: string,
  options?: { perkStyleId?: number; order?: number }
): HasPerkStyleCombinator => ({
  id: `hasPerkStyle-${crypto.randomUUID()}`,
  type: 'hasPerkStyle',
  args: [paramArg(options?.perkStyleId ?? 8000), paramArg(options?.order ?? -1)],
  parentId
})

export const createHasSpellCombinator = (
  parentId: string,
  options?: { spellId?: number; order?: number }
): HasSpellCombinator => ({
  id: `hasSpell-${crypto.randomUUID()}`,
  type: 'hasSpell',
  args: [paramArg(options?.spellId ?? 4), paramArg(options?.order ?? -1)],
  parentId
})

export const createHasItemCombinator = (
  parentId: string,
  options?: { itemId?: number; order?: number }
): HasItemCombinator => ({
  id: `hasItem-${crypto.randomUUID()}`,
  type: 'hasItem',
  args: [paramArg(options?.itemId ?? 3031), paramArg(options?.order ?? -1)],
  parentId
})

export const createEnemiesCombinator = (
  parentId: string,
  options?: { puuid?: string | null; arg?: CombinatorArgNodeRef }
): EnemiesCombinator => ({
  id: `enemies-${crypto.randomUUID()}`,
  type: 'enemies',
  args: [paramArg(options?.puuid ?? null), options?.arg ?? nodeArg(null)],
  parentId
})

export const createAlliesCombinator = (
  parentId: string,
  options?: { puuid?: string | null; arg?: CombinatorArgNodeRef }
): AlliesCombinator => ({
  id: `allies-${crypto.randomUUID()}`,
  type: 'allies',
  args: [paramArg(options?.puuid ?? null), options?.arg ?? nodeArg(null)],
  parentId
})

export const createAllCombinator = (
  parentId: string,
  options?: { arg?: CombinatorArgNodeRef }
): AllCombinator => ({
  id: `all-${crypto.randomUUID()}`,
  type: 'all',
  args: [options?.arg ?? nodeArg(null)],
  parentId
})

export const createAnyoneCombinator = (
  parentId: string,
  options?: { arg?: CombinatorArgNodeRef }
): AnyoneCombinator => ({
  id: `anyone-${crypto.randomUUID()}`,
  type: 'anyone',
  args: [options?.arg ?? nodeArg(null)],
  parentId
})

export const createEveryoneCombinator = (
  parentId: string,
  options?: { arg?: CombinatorArgNodeRef }
): EveryoneCombinator => ({
  id: `everyone-${crypto.randomUUID()}`,
  type: 'everyone',
  args: [options?.arg ?? nodeArg(null)],
  parentId
})

export const createIsChampionCombinator = (
  parentId: string,
  options?: { championId?: number }
): IsChampionCombinator => ({
  id: `isChampion-${crypto.randomUUID()}`,
  type: 'isChampion',
  args: [paramArg(options?.championId ?? 893)],
  parentId
})

export const createIsPositionCombinator = (
  parentId: string,
  options?: { position?: string }
): IsPositionCombinator => ({
  id: `isPosition-${crypto.randomUUID()}`,
  type: 'isPosition',
  args: [paramArg(options?.position ?? 'TOP')],
  parentId
})

export const createIsQueueCombinator = (
  parentId: string,
  options?: { queueId?: number }
): IsQueueCombinator => ({
  id: `isQueue-${crypto.randomUUID()}`,
  type: 'isQueue',
  args: [paramArg(options?.queueId ?? 450)],
  parentId
})

export const createIsGameModeCombinator = (
  parentId: string,
  options?: { gameMode?: string }
): IsGameModeCombinator => ({
  id: `isGameMode-${crypto.randomUUID()}`,
  type: 'isGameMode',
  args: [paramArg(options?.gameMode ?? 'CLASSIC')],
  parentId
})

export const createIsMapCombinator = (
  parentId: string,
  options?: { mapId?: number }
): IsMapCombinator => ({
  id: `isMap-${crypto.randomUUID()}`,
  type: 'isMap',
  args: [paramArg(options?.mapId ?? 11)],
  parentId
})

export const createDurationBetweenCombinator = (
  parentId: string,
  options?: { minSeconds?: number; maxSeconds?: number }
): DurationBetweenCombinator => ({
  id: `durationBetween-${crypto.randomUUID()}`,
  type: 'durationBetween',
  args: [paramArg(options?.minSeconds ?? 0), paramArg(options?.maxSeconds ?? 999999)],
  parentId
})

const createNumberBetweenCombinator = <T extends string>(
  type: T,
  parentId: string,
  options?: { mode?: NumberBetweenMeasureMode; min?: number; max?: number },
  defaults: { min: number; max: number; withMeasureMode?: boolean } = { min: 0, max: 999999 }
): NumberBetweenCombinator<T> => ({
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
})

export const createKdaBetweenCombinator = (
  parentId: string,
  options?: { minKda?: number; maxKda?: number }
): KdaBetweenCombinator => ({
  id: `kdaBetween-${crypto.randomUUID()}`,
  type: 'kdaBetween',
  args: [paramArg(options?.minKda ?? 0), paramArg(options?.maxKda ?? 999)],
  parentId
})

export const createLevelBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) => createNumberBetweenCombinator('levelBetween', parentId, options, { min: 1, max: 18 })

export const createCsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('csBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createKillParticipationBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('killParticipationBetween', parentId, options, {
    min: 0,
    max: 100
  })

export const createDamageDealtToChampionsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('damageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createPhysicalDamageDealtToChampionsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('physicalDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createMagicDamageDealtToChampionsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('magicDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createTrueDamageDealtToChampionsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('trueDamageDealtToChampionsBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createDamageTakenBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('damageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createPhysicalDamageTakenBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('physicalDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createMagicDamageTakenBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('magicDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createTrueDamageTakenBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('trueDamageTakenBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createGoldSpentBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('goldSpentBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createDamageToTowersBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('damageToTowersBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createHealBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('healBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createVisionScoreBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('visionScoreBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createTimeCCingOthersBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('timeCCingOthersBetween', parentId, options, {
    min: 0,
    max: 999999,
    withMeasureMode: true
  })

export const createDgrBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) => createNumberBetweenCombinator('dgrBetween', parentId, options, { min: 0, max: 500 })

export const createSoloKillsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('soloKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })

export const createDoubleKillsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('doubleKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })

export const createTripleKillsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('tripleKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })

export const createQuadraKillsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('quadraKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })

export const createPentaKillsBetweenCombinator = (
  parentId: string,
  options?: { min?: number; max?: number }
) =>
  createNumberBetweenCombinator('pentaKillsBetween', parentId, options, {
    min: 0,
    max: 20,
    withMeasureMode: true
  })

export const createKillsBetweenCombinator = (
  parentId: string,
  options?: { mode?: NumberBetweenMeasureMode; minKills?: number; maxKills?: number }
): KillsBetweenCombinator =>
  createNumberBetweenCombinator(
    'killsBetween',
    parentId,
    { mode: options?.mode, min: options?.minKills, max: options?.maxKills },
    { min: 0, max: 999, withMeasureMode: true }
  )

export const createDeathsBetweenCombinator = (
  parentId: string,
  options?: { mode?: NumberBetweenMeasureMode; minDeaths?: number; maxDeaths?: number }
): DeathsBetweenCombinator =>
  createNumberBetweenCombinator(
    'deathsBetween',
    parentId,
    { mode: options?.mode, min: options?.minDeaths, max: options?.maxDeaths },
    { min: 0, max: 999, withMeasureMode: true }
  )

export const createAssistsBetweenCombinator = (
  parentId: string,
  options?: { mode?: NumberBetweenMeasureMode; minAssists?: number; maxAssists?: number }
): AssistsBetweenCombinator =>
  createNumberBetweenCombinator(
    'assistsBetween',
    parentId,
    { mode: options?.mode, min: options?.minAssists, max: options?.maxAssists },
    { min: 0, max: 999, withMeasureMode: true }
  )

export const createGoldBetweenCombinator = (
  parentId: string,
  options?: { mode?: NumberBetweenMeasureMode; minGold?: number; maxGold?: number }
): GoldBetweenCombinator =>
  createNumberBetweenCombinator(
    'goldBetween',
    parentId,
    { mode: options?.mode, min: options?.minGold, max: options?.maxGold },
    { min: 0, max: 999999, withMeasureMode: true }
  )

export const createPlayerCombinator = (
  parentId: string,
  options?: { puuid?: string | null }
): PlayerCombinator => ({
  id: `player-${crypto.randomUUID()}`,
  type: 'player',
  args: [paramArg(options?.puuid ?? null), nodeArg(null)],
  parentId
})

export const createHasPlayerCombinator = (
  parentId: string,
  options?: { puuid?: string | null }
): HasPlayerCombinator => ({
  id: `hasPlayer-${crypto.randomUUID()}`,
  type: 'hasPlayer',
  args: [paramArg(options?.puuid ?? null)],
  parentId
})
export const createIsMatchedGameCombinator = (
  parentId: string,
  _options?: unknown
): IsMatchedGameCombinator => ({
  id: `isMatchedGame-${crypto.randomUUID()}`,
  type: 'isMatchedGame',
  args: [],
  parentId
})

export const createIsPveGameCombinator = (
  parentId: string,
  _options?: unknown
): IsPveGameCombinator => ({
  id: `isPveGame-${crypto.randomUUID()}`,
  type: 'isPveGame',
  args: [],
  parentId
})
