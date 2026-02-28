import { CombinatorNode, isNodeArg } from './combinator-nodes'
import {
  Predicate,
  all,
  allies,
  and,
  anyone,
  assistsBetween,
  deathsBetween,
  durationBetween,
  enemies,
  everyone,
  game,
  goldBetween,
  hasAugment,
  hasItem,
  hasPlayer,
  hasSpell,
  isAbort,
  isChampion,
  isLoss,
  isMatchedGame,
  isPosition,
  isPveGame,
  isQueue,
  isRemake,
  isWin,
  kdaBetween,
  killsBetween,
  not,
  or,
  player
} from './combinators'

export const COMBINATOR_MAP = {
  game: game,
  and: and,
  or: or,
  not: not,
  isQueue: isQueue,
  isAbort: isAbort,
  isRemake: isRemake,
  hasAugment: hasAugment,
  enemies: enemies,
  allies: allies,
  all: all,
  player: player,
  hasPlayer: hasPlayer,
  anyone: anyone,
  everyone: everyone,
  hasSpell: hasSpell,
  isPosition: isPosition,
  hasItem: hasItem,
  isChampion: isChampion,
  durationBetween: durationBetween,
  kdaBetween: kdaBetween,
  killsBetween: killsBetween,
  deathsBetween: deathsBetween,
  assistsBetween: assistsBetween,
  goldBetween: goldBetween,
  isWin: isWin,
  isLoss: isLoss,
  isMatchedGame: isMatchedGame,
  isPveGame: isPveGame
}

/**
 * 一个 combinator 可以提供什么样的 scope
 */
export const PROVIDE_SCOPE_MAP = {
  game: 'game',
  and: null,
  or: null,
  not: null,
  isQueue: null,
  isAbort: null,
  isRemake: null,
  hasAugment: null,
  enemies: 'participants',
  allies: 'participants',
  all: 'participants',
  player: 'participant',
  hasPlayer: null,
  anyone: 'participant',
  everyone: 'participant',
  hasSpell: null,
  isPosition: null,
  hasItem: null,
  isChampion: null,
  durationBetween: null,
  kdaBetween: null,
  killsBetween: null,
  deathsBetween: null,
  assistsBetween: null,
  goldBetween: null,
  isWin: null,
  isLoss: null,
  isMatchedGame: null,
  isPveGame: null
}

export const toPredicate = (rootId: string, nodeMap: Record<string, CombinatorNode>) => {
  const root = nodeMap[rootId]

  if (!root) {
    throw new Error(`Root node not found: ${rootId}`)
  }

  const fn = COMBINATOR_MAP[root.type] as (...args: any[]) => Predicate<unknown>

  if (!fn) {
    throw new Error(`Unknown predicate type: ${root.type}`)
  }

  let hasNullNodeArg = false // 对于未完成的子节点，倾向于让其直接强制真，符合直觉
  const mappedArgs: unknown[] = []

  for (const arg of root.args) {
    if (isNodeArg(arg)) {
      if (arg.value) {
        mappedArgs.push(toPredicate(arg.value, nodeMap))
        continue
      }

      hasNullNodeArg = true
      break
    } else {
      mappedArgs.push(arg.value)
    }
  }

  if (hasNullNodeArg) {
    return (_: unknown) => true
  }

  return fn(...mappedArgs)
}

/**
 * 查找最近所属的 scope，跳过 null 节点
 */
export const getScope = (rootId: string, nodeMap: Record<string, CombinatorNode>) => {
  const root = nodeMap[rootId]

  if (!root) {
    throw new Error(`Root node not found: ${rootId}`)
  }

  let current: string | null = root.id

  while (current) {
    const node = nodeMap[current]

    if (!node) {
      throw new Error(`Node not found: ${current}`)
    }

    if (PROVIDE_SCOPE_MAP[node.type] !== null) {
      return PROVIDE_SCOPE_MAP[node.type] as string
    }

    current = node.parentId
  }

  throw new Error(`No scope found for node: ${rootId}`)
}
