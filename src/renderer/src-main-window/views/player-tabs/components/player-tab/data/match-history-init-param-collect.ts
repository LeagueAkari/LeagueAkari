import type { MatchHistoryInitParams } from '@main-window/shards/player-tabs/context'

import {
  type CombinatorNode,
  type NonNullCombinatorArgNodeRef,
  nodeArg,
  paramArg
} from '../widgets/match-history-filters/combinator-nodes'
import {
  type MatchHistoryFilterState,
  ROOT_ID,
  STATE_VERSION
} from '../widgets/match-history-filters/filter-state'

export const MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS = {
  countPerIteration: 20,
  defaultExpectedCount: 20,
  maxExpectedCount: 1000,
  maxScannedGames: 1000,
  scannedGamesMultiplier: 10
} as const

export const createInitParamCollectSettings = (initParams: MatchHistoryInitParams) => {
  const rawExpectedCount =
    typeof initParams.expectedCount === 'number' && initParams.expectedCount > 0
      ? initParams.expectedCount
      : MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.defaultExpectedCount
  const expectedCount = Math.min(
    rawExpectedCount,
    MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.maxExpectedCount
  )
  const maxScannedGames = Math.min(
    expectedCount * MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.scannedGamesMultiplier,
    MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.maxScannedGames
  )

  return {
    countPerIteration: MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.countPerIteration,
    expectedCount,
    maxIteration: Math.max(
      Math.ceil(maxScannedGames / MATCH_HISTORY_INIT_PARAM_COLLECT_SETTINGS.countPerIteration),
      1
    )
  }
}

const hasCollectChampion = (
  initParams: MatchHistoryInitParams
): initParams is MatchHistoryInitParams & { collectByChampionId: number } => {
  return typeof initParams.collectByChampionId === 'number' && initParams.collectByChampionId > 0
}

const hasCollectPosition = (
  initParams: MatchHistoryInitParams
): initParams is MatchHistoryInitParams & { collectByPosition: string } => {
  return typeof initParams.collectByPosition === 'string' && initParams.collectByPosition.length > 0
}

export const createInitParamCollectFilterState = (
  initParams: MatchHistoryInitParams,
  currentPuuid: string
): MatchHistoryFilterState | null => {
  const shouldCollectByChampion = hasCollectChampion(initParams)
  const shouldCollectByPosition = hasCollectPosition(initParams)

  if (!shouldCollectByChampion && !shouldCollectByPosition) {
    return null
  }

  const rootId = ROOT_ID
  const playerId = 'init-param-collect-player'
  const playerAndId = 'init-param-collect-player-and'
  const championId = 'init-param-collect-champion'
  const positionId = 'init-param-collect-position'

  const childNodeRefs: NonNullCombinatorArgNodeRef[] = []
  const nodeMap: Record<string, CombinatorNode> = {
    [rootId]: {
      id: rootId,
      type: 'game',
      args: [nodeArg(playerId)],
      parentId: null
    }
  }

  if (shouldCollectByChampion) {
    childNodeRefs.push(nodeArg(championId) as NonNullCombinatorArgNodeRef)
    nodeMap[championId] = {
      id: championId,
      type: 'isChampion',
      args: [paramArg(initParams.collectByChampionId)],
      parentId: shouldCollectByPosition ? playerAndId : playerId
    }
  }

  if (shouldCollectByPosition) {
    childNodeRefs.push(nodeArg(positionId) as NonNullCombinatorArgNodeRef)
    nodeMap[positionId] = {
      id: positionId,
      type: 'isPosition',
      args: [paramArg(initParams.collectByPosition)],
      parentId: shouldCollectByChampion ? playerAndId : playerId
    }
  }

  if (shouldCollectByChampion && shouldCollectByPosition) {
    nodeMap[playerAndId] = {
      id: playerAndId,
      type: 'and',
      args: childNodeRefs,
      parentId: playerId,
      argDeleteStrategy: 'remove-from-array'
    }
  }

  nodeMap[playerId] = {
    id: playerId,
    type: 'player',
    args: [
      paramArg(currentPuuid),
      nodeArg(
        shouldCollectByChampion && shouldCollectByPosition ? playerAndId : childNodeRefs[0].value
      )
    ],
    parentId: rootId
  }

  return {
    version: STATE_VERSION,
    rootId,
    nodeMap,
    cachedSummoners: {}
  }
}
