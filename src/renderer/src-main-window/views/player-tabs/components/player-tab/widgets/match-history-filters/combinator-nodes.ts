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
export type IsAbortCombinator = CombinatorNode<'isAbort', []>
export type IsRemakeCombinator = CombinatorNode<'isRemake', []>
export type IsWinCombinator = CombinatorNode<'isWin', []>
export type IsLossCombinator = CombinatorNode<'isLoss', [CombinatorArgParam<boolean>]>
export type HasAugmentCombinator = CombinatorNode<
  'hasAugment',
  [CombinatorArgParam<number | null>, CombinatorArgParam<number>]
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
export type DurationBetweenCombinator = CombinatorNode<
  'durationBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type KdaBetweenCombinator = CombinatorNode<
  'kdaBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type KillsBetweenCombinator = CombinatorNode<
  'killsBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type DeathsBetweenCombinator = CombinatorNode<
  'deathsBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type AssistsBetweenCombinator = CombinatorNode<
  'assistsBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
export type GoldBetweenCombinator = CombinatorNode<
  'goldBetween',
  [CombinatorArgParam<number>, CombinatorArgParam<number>]
>
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
