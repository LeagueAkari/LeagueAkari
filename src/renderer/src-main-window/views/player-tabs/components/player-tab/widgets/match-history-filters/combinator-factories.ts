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
  HasSpellCombinator,
  IsAbortCombinator,
  IsChampionCombinator,
  IsLossCombinator,
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

export const createDurationBetweenCombinator = (
  parentId: string,
  options?: { minSeconds?: number; maxSeconds?: number }
): DurationBetweenCombinator => ({
  id: `durationBetween-${crypto.randomUUID()}`,
  type: 'durationBetween',
  args: [paramArg(options?.minSeconds ?? 0), paramArg(options?.maxSeconds ?? 999999)],
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

export const createKillsBetweenCombinator = (
  parentId: string,
  options?: { minKills?: number; maxKills?: number }
): KillsBetweenCombinator => ({
  id: `killsBetween-${crypto.randomUUID()}`,
  type: 'killsBetween',
  args: [paramArg(options?.minKills ?? 0), paramArg(options?.maxKills ?? 999)],
  parentId
})

export const createDeathsBetweenCombinator = (
  parentId: string,
  options?: { minDeaths?: number; maxDeaths?: number }
): DeathsBetweenCombinator => ({
  id: `deathsBetween-${crypto.randomUUID()}`,
  type: 'deathsBetween',
  args: [paramArg(options?.minDeaths ?? 0), paramArg(options?.maxDeaths ?? 999)],
  parentId
})

export const createAssistsBetweenCombinator = (
  parentId: string,
  options?: { minAssists?: number; maxAssists?: number }
): AssistsBetweenCombinator => ({
  id: `assistsBetween-${crypto.randomUUID()}`,
  type: 'assistsBetween',
  args: [paramArg(options?.minAssists ?? 0), paramArg(options?.maxAssists ?? 999)],
  parentId
})

export const createGoldBetweenCombinator = (
  parentId: string,
  options?: { minGold?: number; maxGold?: number }
): GoldBetweenCombinator => ({
  id: `goldBetween-${crypto.randomUUID()}`,
  type: 'goldBetween',
  args: [paramArg(options?.minGold ?? 0), paramArg(options?.maxGold ?? 999999)],
  parentId
})

export const createPlayerCombinator = (
  parentId: string,
  options?: { puuid?: string | null }
): PlayerCombinator => ({
  id: `player-${crypto.randomUUID()}`,
  type: 'player',
  args: [paramArg(options?.puuid ?? null), nodeArg(null)],
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
