import { Predicate } from '@shared/data-adapter/predicates/combinators'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'

import {
  CombinatorNode,
  GameCombinator,
  NonNullCombinatorArgNodeRef,
  collectSubtreeNodeIds,
  nodeArg,
  paramArg
} from './combinator-nodes'
import { toPredicate as toCombinatorPredicate } from './combinator-runtime'

export type SimpleSummonerResult = {
  puuid: string
  profileIconId: number
  gameName: string
  tagLine: string
}

export const ROOT_ID = 'root'
export const STATE_VERSION = 1
export const SIMPLE_STATE_VERSION = 1

export type MatchHistoryFilterMode = 'simple' | 'advanced'
export type SimpleWinLossFilter = 'all' | 'win' | 'loss'

export type MatchHistoryFilterState = {
  version: typeof STATE_VERSION
  rootId: typeof ROOT_ID
  nodeMap: Record<string, CombinatorNode>
  cachedSummoners: Record<string, SimpleSummonerResult>
}

export type SimpleMatchHistoryFilterState = {
  version: typeof SIMPLE_STATE_VERSION
  winLoss: SimpleWinLossFilter
  positions: string[]
  championIds: number[]
  summonerPuuids: string[]
  cachedSummoners: Record<string, SimpleSummonerResult>
}

export type SimplePredicateOptions = {
  enablePosition?: boolean
}

export const createEmptyState = (): MatchHistoryFilterState => ({
  version: STATE_VERSION,
  rootId: ROOT_ID,
  nodeMap: {
    [ROOT_ID]: {
      id: ROOT_ID,
      type: 'game',
      args: [nodeArg(null)],
      parentId: null
    }
  },
  cachedSummoners: {}
})

export const createEmptySimpleState = (): SimpleMatchHistoryFilterState => ({
  version: SIMPLE_STATE_VERSION,
  winLoss: 'all',
  positions: [],
  championIds: [],
  summonerPuuids: [],
  cachedSummoners: {}
})

export const getRootNode = (state: MatchHistoryFilterState): GameCombinator => {
  return state.nodeMap[state.rootId] as GameCombinator
}

export const hasSimplePredicate = (
  state: SimpleMatchHistoryFilterState,
  options: SimplePredicateOptions = {}
) => {
  return (
    state.winLoss !== 'all' ||
    (options.enablePosition === true && state.positions.length > 0) ||
    state.championIds.length > 0 ||
    state.summonerPuuids.length > 0
  )
}

export const hasPredicate = (state: MatchHistoryFilterState) => {
  return getRootNode(state).args[0].value !== null
}

export const addNode = (
  state: MatchHistoryFilterState,
  node: CombinatorNode
): MatchHistoryFilterState => {
  return {
    ...state,
    nodeMap: {
      ...state.nodeMap,
      [node.id]: node
    }
  }
}

export const updateNode = (
  state: MatchHistoryFilterState,
  id: string,
  node: CombinatorNode
): MatchHistoryFilterState => {
  return {
    ...state,
    nodeMap: {
      ...state.nodeMap,
      [id]: node
    }
  }
}

export const insertSiblingWithOr = (
  state: MatchHistoryFilterState,
  id: string,
  siblingNode: CombinatorNode
): MatchHistoryFilterState => {
  const currentNode = state.nodeMap[id]

  if (!currentNode?.parentId) {
    return state
  }

  const parentNode = state.nodeMap[currentNode.parentId]

  if (!parentNode) {
    return state
  }

  const siblingArg = nodeArg(siblingNode.id) as NonNullCombinatorArgNodeRef

  if (parentNode.type === 'or') {
    return {
      ...state,
      nodeMap: {
        ...state.nodeMap,
        [siblingNode.id]: {
          ...siblingNode,
          parentId: parentNode.id
        },
        [parentNode.id]: {
          ...parentNode,
          args: [...parentNode.args, siblingArg]
        }
      }
    }
  }

  const orNode: CombinatorNode<'or', NonNullCombinatorArgNodeRef[]> = {
    id: `or-${crypto.randomUUID()}`,
    type: 'or',
    args: [nodeArg(currentNode.id) as NonNullCombinatorArgNodeRef, siblingArg],
    parentId: parentNode.id,
    argDeleteStrategy: 'remove-from-array'
  }

  return {
    ...state,
    nodeMap: {
      ...state.nodeMap,
      [parentNode.id]: {
        ...parentNode,
        args: parentNode.args.map((arg) =>
          arg && arg.kind === 'node' && arg.value === currentNode.id ? nodeArg(orNode.id) : arg
        )
      },
      [currentNode.id]: {
        ...currentNode,
        parentId: orNode.id
      },
      [siblingNode.id]: {
        ...siblingNode,
        parentId: orNode.id
      },
      [orNode.id]: orNode
    }
  }
}

export const deleteNode = (state: MatchHistoryFilterState, id: string): MatchHistoryFilterState => {
  if (id === state.rootId) {
    return clearPredicate(state)
  }

  const target = state.nodeMap[id]
  if (!target) return state

  const ids = collectSubtreeNodeIds(id, state.nodeMap)
  const nextNodeMap = { ...state.nodeMap }

  if (target.parentId) {
    const parent = state.nodeMap[target.parentId]

    if (parent) {
      if (parent.argDeleteStrategy === 'remove-from-array') {
        nextNodeMap[parent.id] = {
          ...parent,
          args: parent.args.filter((a) => !(a && a.kind === 'node' && a.value === id))
        }
      } else {
        nextNodeMap[parent.id] = {
          ...parent,
          args: parent.args.map((a) =>
            a && a.kind === 'node' && a.value === id ? nodeArg(null) : a
          )
        }
      }
    }
  }

  ids.forEach((nodeId) => {
    delete nextNodeMap[nodeId]
  })

  return {
    ...state,
    nodeMap: nextNodeMap
  }
}

export const clearPredicate = (state: MatchHistoryFilterState): MatchHistoryFilterState => {
  const rootNode = getRootNode(state)
  const childId = rootNode.args[0].value

  if (!childId) {
    return {
      ...state,
      cachedSummoners: {}
    }
  }

  const ids = collectSubtreeNodeIds(childId, state.nodeMap)
  const nextNodeMap = {
    ...state.nodeMap,
    [state.rootId]: {
      ...rootNode,
      args: [nodeArg(null)]
    }
  }

  ids.forEach((nodeId) => {
    delete nextNodeMap[nodeId]
  })

  return {
    ...state,
    nodeMap: nextNodeMap,
    cachedSummoners: {}
  }
}

export const saveSummoner = (
  state: MatchHistoryFilterState,
  puuid: string,
  summoner: SimpleSummonerResult
): MatchHistoryFilterState => {
  return {
    ...state,
    cachedSummoners: {
      ...state.cachedSummoners,
      [puuid]: summoner
    }
  }
}

export const clearSimplePredicate = (
  state: SimpleMatchHistoryFilterState
): SimpleMatchHistoryFilterState => {
  return {
    ...createEmptySimpleState(),
    version: state.version
  }
}

const createSimpleNodeId = (name: string) => {
  return `simple-${name}`
}

export const toFilterState = (
  state: SimpleMatchHistoryFilterState,
  currentPuuid: string,
  options: SimplePredicateOptions = {}
): MatchHistoryFilterState => {
  if (!hasSimplePredicate(state, options)) {
    return {
      ...createEmptyState(),
      cachedSummoners: state.cachedSummoners
    }
  }

  const nodeMap: Record<string, CombinatorNode> = {}
  const rootNode = {
    id: ROOT_ID,
    type: 'game',
    args: [nodeArg(createSimpleNodeId('and'))],
    parentId: null
  } satisfies CombinatorNode<'game'>
  const andNode: CombinatorNode<'and', NonNullCombinatorArgNodeRef[]> = {
    id: createSimpleNodeId('and'),
    type: 'and',
    args: [],
    parentId: ROOT_ID,
    argDeleteStrategy: 'remove-from-array'
  }

  nodeMap[rootNode.id] = rootNode
  nodeMap[andNode.id] = andNode

  const addChild = (node: CombinatorNode) => {
    nodeMap[node.id] = node
    andNode.args.push(nodeArg(node.id) as NonNullCombinatorArgNodeRef)
  }

  if (state.winLoss !== 'all') {
    const playerNodeId = createSimpleNodeId('result-player')
    const resultNodeId = createSimpleNodeId(`result-${state.winLoss}`)

    if (state.winLoss === 'win') {
      nodeMap[resultNodeId] = {
        id: resultNodeId,
        type: 'isWin',
        args: [],
        parentId: playerNodeId
      }
    } else {
      const normalLossNodeId = createSimpleNodeId('result-loss-normal')
      const surrenderLossNodeId = createSimpleNodeId('result-loss-surrender')

      nodeMap[resultNodeId] = {
        id: resultNodeId,
        type: 'or',
        args: [nodeArg(normalLossNodeId), nodeArg(surrenderLossNodeId)],
        parentId: playerNodeId,
        argDeleteStrategy: 'remove-from-array'
      }
      nodeMap[normalLossNodeId] = {
        id: normalLossNodeId,
        type: 'isLoss',
        args: [paramArg(false)],
        parentId: resultNodeId
      }
      nodeMap[surrenderLossNodeId] = {
        id: surrenderLossNodeId,
        type: 'isLoss',
        args: [paramArg(true)],
        parentId: resultNodeId
      }
    }

    addChild({
      id: playerNodeId,
      type: 'player',
      args: [paramArg(currentPuuid), nodeArg(resultNodeId)],
      parentId: andNode.id
    })
  }

  if (options.enablePosition === true && state.positions.length > 0) {
    const playerNodeId = createSimpleNodeId('position-player')
    const positionNodeId = createSimpleNodeId('position')

    if (state.positions.length === 1) {
      nodeMap[positionNodeId] = {
        id: positionNodeId,
        type: 'isPosition',
        args: [paramArg(state.positions[0])],
        parentId: playerNodeId
      }
    } else {
      nodeMap[positionNodeId] = {
        id: positionNodeId,
        type: 'or',
        args: state.positions.map((position) =>
          nodeArg(createSimpleNodeId(`position-${position}`))
        ),
        parentId: playerNodeId,
        argDeleteStrategy: 'remove-from-array'
      }

      state.positions.forEach((position) => {
        const childNodeId = createSimpleNodeId(`position-${position}`)

        nodeMap[childNodeId] = {
          id: childNodeId,
          type: 'isPosition',
          args: [paramArg(position)],
          parentId: positionNodeId
        }
      })
    }

    addChild({
      id: playerNodeId,
      type: 'player',
      args: [paramArg(currentPuuid), nodeArg(positionNodeId)],
      parentId: andNode.id
    })
  }

  state.summonerPuuids.forEach((summonerPuuid, index) => {
    addChild({
      id: createSimpleNodeId(`summoner-${index}`),
      type: 'hasPlayer',
      args: [paramArg(summonerPuuid)],
      parentId: andNode.id
    })
  })

  state.championIds.forEach((championId, index) => {
    const anyoneNodeId = createSimpleNodeId(`champion-${index}`)
    const championNodeId = createSimpleNodeId(`champion-${index}-isChampion`)

    nodeMap[championNodeId] = {
      id: championNodeId,
      type: 'isChampion',
      args: [paramArg(championId)],
      parentId: anyoneNodeId
    }

    addChild({
      id: anyoneNodeId,
      type: 'anyone',
      args: [nodeArg(championNodeId)],
      parentId: andNode.id
    })
  })

  return {
    version: STATE_VERSION,
    rootId: ROOT_ID,
    nodeMap,
    cachedSummoners: state.cachedSummoners
  }
}

export const toPredicate = (state: MatchHistoryFilterState): Predicate<LcuOrSgpGameSummary> => {
  return toCombinatorPredicate(state.rootId, state.nodeMap) as Predicate<LcuOrSgpGameSummary>
}
