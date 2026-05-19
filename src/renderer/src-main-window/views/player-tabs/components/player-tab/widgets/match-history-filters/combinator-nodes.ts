export type CombinatorArgNodeRef = {
  kind: 'node'
  value: string | null
}

export type NonNullCombinatorArgNodeRef = {
  kind: 'node'
  value: string
}

export type CombinatorArgParam<T = unknown> = {
  kind: 'param'
  value: T
}

// 约定上，所有的 node arg 都应该放在最后面
export type CombinatorArg<T = unknown> = CombinatorArgNodeRef | CombinatorArgParam<T>
export type NumberBetweenMeasureMode =
  | 'value'
  | 'teamShare'
  | 'teamMaxShare'
  | 'gameShare'
  | 'gameMaxShare'
export type NumberBetweenArgs =
  | [CombinatorArgParam<number>, CombinatorArgParam<number>]
  | [
      CombinatorArgParam<NumberBetweenMeasureMode>,
      CombinatorArgParam<number>,
      CombinatorArgParam<number>
    ]

export type CombinatorNode<
  T extends string = string,
  R extends CombinatorArg[] = CombinatorArg[]
> = {
  id: string
  type: T
  args: R
  parentId: string | null
  argDeleteStrategy?: 'set-to-null' | 'remove-from-array' // default is 'set-to-null'
}

export type GameCombinator = CombinatorNode<'game', [CombinatorArgNodeRef]>
export type AndCombinator = CombinatorNode<'and', NonNullCombinatorArgNodeRef[]>
export type OrCombinator = CombinatorNode<'or', NonNullCombinatorArgNodeRef[]>
export type NotCombinator = CombinatorNode<'not', [CombinatorArgNodeRef]>
export type IsGameModeCombinator = CombinatorNode<'isGameMode', [CombinatorArgParam<string>]>
export type IsMapCombinator = CombinatorNode<'isMap', [CombinatorArgParam<number>]>
export type IsAbortCombinator = CombinatorNode<'isAbort', []>
export type IsRemakeCombinator = CombinatorNode<'isRemake', []>
export type IsWinCombinator = CombinatorNode<'isWin', []>
export type IsLossCombinator = CombinatorNode<'isLoss', [CombinatorArgParam<boolean>]>
export type HasAugmentCombinator = CombinatorNode<
  'hasAugment',
  [CombinatorArgParam<number | null>, CombinatorArgParam<number>]
>
export type HasPerkCombinator = CombinatorNode<
  'hasPerk',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type HasPerkStyleCombinator = CombinatorNode<
  'hasPerkStyle',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type EnemiesCombinator = CombinatorNode<
  'enemies',
  [CombinatorArgParam<string | null>, CombinatorArgNodeRef]
>
export type AlliesCombinator = CombinatorNode<
  'allies',
  [CombinatorArgParam<string | null>, CombinatorArgNodeRef]
>
export type AllCombinator = CombinatorNode<'all', [CombinatorArgNodeRef]>
export type AnyoneCombinator = CombinatorNode<'anyone', [CombinatorArgNodeRef]>
export type EveryoneCombinator = CombinatorNode<'everyone', [CombinatorArgNodeRef]>
export type IsChampionCombinator = CombinatorNode<'isChampion', [CombinatorArgParam<number>]>
export type IsQueueCombinator = CombinatorNode<'isQueue', [CombinatorArgParam<number>]>
export type NumberBetweenCombinator<T extends string = string> = CombinatorNode<
  T,
  NumberBetweenArgs
>
export type DurationBetweenCombinator = NumberBetweenCombinator<'durationBetween'>
export type GameCreationInTimeRangeCombinator = CombinatorNode<
  'gameCreationInTimeRange',
  [CombinatorArgParam<string | null>]
>
export type KdaBetweenCombinator = NumberBetweenCombinator<'kdaBetween'>
export type KillsBetweenCombinator = NumberBetweenCombinator<'killsBetween'>
export type DeathsBetweenCombinator = NumberBetweenCombinator<'deathsBetween'>
export type AssistsBetweenCombinator = NumberBetweenCombinator<'assistsBetween'>
export type GoldBetweenCombinator = NumberBetweenCombinator<'goldBetween'>
export type LevelBetweenCombinator = NumberBetweenCombinator<'levelBetween'>
export type CsBetweenCombinator = NumberBetweenCombinator<'csBetween'>
export type KillParticipationBetweenCombinator = NumberBetweenCombinator<'killParticipationBetween'>
export type DamageDealtToChampionsBetweenCombinator =
  NumberBetweenCombinator<'damageDealtToChampionsBetween'>
export type PhysicalDamageDealtToChampionsBetweenCombinator =
  NumberBetweenCombinator<'physicalDamageDealtToChampionsBetween'>
export type MagicDamageDealtToChampionsBetweenCombinator =
  NumberBetweenCombinator<'magicDamageDealtToChampionsBetween'>
export type TrueDamageDealtToChampionsBetweenCombinator =
  NumberBetweenCombinator<'trueDamageDealtToChampionsBetween'>
export type DamageTakenBetweenCombinator = NumberBetweenCombinator<'damageTakenBetween'>
export type PhysicalDamageTakenBetweenCombinator =
  NumberBetweenCombinator<'physicalDamageTakenBetween'>
export type MagicDamageTakenBetweenCombinator = NumberBetweenCombinator<'magicDamageTakenBetween'>
export type TrueDamageTakenBetweenCombinator = NumberBetweenCombinator<'trueDamageTakenBetween'>
export type GoldSpentBetweenCombinator = NumberBetweenCombinator<'goldSpentBetween'>
export type DamageToTowersBetweenCombinator = NumberBetweenCombinator<'damageToTowersBetween'>
export type HealBetweenCombinator = NumberBetweenCombinator<'healBetween'>
export type VisionScoreBetweenCombinator = NumberBetweenCombinator<'visionScoreBetween'>
export type TimeCCingOthersBetweenCombinator = NumberBetweenCombinator<'timeCCingOthersBetween'>
export type DgrBetweenCombinator = NumberBetweenCombinator<'dgrBetween'>
export type SoloKillsBetweenCombinator = NumberBetweenCombinator<'soloKillsBetween'>
export type DoubleKillsBetweenCombinator = NumberBetweenCombinator<'doubleKillsBetween'>
export type TripleKillsBetweenCombinator = NumberBetweenCombinator<'tripleKillsBetween'>
export type QuadraKillsBetweenCombinator = NumberBetweenCombinator<'quadraKillsBetween'>
export type PentaKillsBetweenCombinator = NumberBetweenCombinator<'pentaKillsBetween'>
export type IsPositionCombinator = CombinatorNode<'isPosition', [CombinatorArgParam<string>]>
export type HasSpellCombinator = CombinatorNode<
  'hasSpell',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type HasItemCombinator = CombinatorNode<
  'hasItem',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type PlayerCombinator = CombinatorNode<
  'player',
  [CombinatorArgParam<string | null>, CombinatorArgNodeRef]
>
export type HasPlayerCombinator = CombinatorNode<'hasPlayer', [CombinatorArgParam<string | null>]>
export type IsMatchedGameCombinator = CombinatorNode<'isMatchedGame', []>
export type IsPveGameCombinator = CombinatorNode<'isPveGame', []>

export const nodeArg = (value: string | null): CombinatorArgNodeRef => ({
  kind: 'node',
  value
})

export const paramArg = <T>(value: T): CombinatorArgParam<T> => ({
  kind: 'param',
  value
})

export const isNodeArg = (arg: CombinatorArg): arg is CombinatorArgNodeRef & { value: string } => {
  return !!arg && arg.kind === 'node'
}

export const isParamArg = (arg: CombinatorArg): arg is CombinatorArgParam<unknown> => {
  return !!arg && arg.kind === 'param'
}

export const collectSubtreeNodeIds = (
  rootId: string,
  nodeMap: Record<string, CombinatorNode>
): Set<string> => {
  const visited = new Set<string>()

  const dfs = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)

    const node = nodeMap[id]
    if (!node) return

    const childIds = node.args.filter(isNodeArg).map((a) => a.value)
    childIds.forEach(dfs)
  }

  dfs(rootId)
  return visited
}
