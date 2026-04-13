import { Predicate } from '@shared/data-adapter/predicates/combinators'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ComputedRef, InjectionKey, Ref, computed, inject, markRaw, provide, ref } from 'vue'

import {
  CombinatorNode,
  GameCombinator,
  collectSubtreeNodeIds,
  nodeArg
} from '../widgets/match-history-filters/combinator-nodes'
import { toPredicate } from '../widgets/match-history-filters/combinator-runtime'

export type SimpleSummonerResult = {
  puuid: string
  profileIconId: number
  gameName: string
  tagLine: string
}

export type MatchHistoryFiltersContext = {
  rootNode: ComputedRef<CombinatorNode>
  nodeMap: Ref<Record<string, CombinatorNode>>
  predicate: ComputedRef<Predicate<LcuOrSgpGameSummary>>
  rootHasCombinator: ComputedRef<boolean>
  cachedSummoners: Ref<Record<string, SimpleSummonerResult>>
  addNode: (node: CombinatorNode) => void
  updateNode: (id: string, node: CombinatorNode) => void
  deleteNode: (id: string) => void
  saveSummoner: (puuid: string, summoner: SimpleSummonerResult) => void
  clearPredicate: () => void
}

export const MatchHistoryFiltersContextKey: InjectionKey<MatchHistoryFiltersContext> = Symbol(
  'PlayerTabMatchHistoryFiltersContext'
)

const ROOT_ID = 'game'

export function provideMatchHistoryFilters() {
  const nodeMap = ref<Record<string, CombinatorNode>>({
    game: {
      id: ROOT_ID,
      type: ROOT_ID,
      args: [nodeArg(null)],
      parentId: null
    }
  })

  const rootNode = computed<GameCombinator>(() => nodeMap.value[ROOT_ID] as GameCombinator)
  const predicate = computed(() => toPredicate(ROOT_ID, nodeMap.value) as Predicate<unknown>)

  const rootHasCombinator = computed(() => {
    return rootNode.value.args[0].value !== null
  })

  const addNode = (node: CombinatorNode) => {
    nodeMap.value[node.id] = node
  }

  const updateNode = (id: string, node: CombinatorNode) => {
    nodeMap.value[id] = node
  }

  const deleteNode = (id: string) => {
    const target = nodeMap.value[id]
    if (!target) return

    const ids = collectSubtreeNodeIds(id, nodeMap.value)

    if (target.parentId) {
      const parent = nodeMap.value[target.parentId]

      if (parent) {
        if (parent.argDeleteStrategy === 'remove-from-array') {
          nodeMap.value[parent.id] = {
            ...parent,
            args: parent.args.filter((a) => !(a && a.kind === 'node' && a.value === id))
          }
        } else {
          nodeMap.value[parent.id] = {
            ...parent,
            args: parent.args.map((a) =>
              a && a.kind === 'node' && a.value === id ? nodeArg(null) : a
            )
          }
        }
      }
    }

    ids.forEach((nodeId) => {
      delete nodeMap.value[nodeId]
    })
  }

  const cachedSummoners = ref<Record<string, SimpleSummonerResult>>({})

  const saveSummoner = (puuid: string, summoner: SimpleSummonerResult) => {
    cachedSummoners.value[puuid] = markRaw(summoner)
  }

  const clearPredicate = () => {
    if (rootNode.value.args[0].value) {
      deleteNode(rootNode.value.args[0].value)
    }

    cachedSummoners.value = {}
  }

  provide(MatchHistoryFiltersContextKey, {
    rootNode,
    nodeMap,
    rootHasCombinator,
    predicate,
    cachedSummoners,
    saveSummoner,
    addNode,
    updateNode,
    deleteNode,
    clearPredicate
  })

  return {
    rootNode,
    nodeMap,
    rootHasCombinator,
    predicate,
    cachedSummoners,
    saveSummoner,
    addNode,
    updateNode,
    deleteNode,
    clearPredicate
  }
}

export function useMatchHistoryFilters() {
  const context = inject(MatchHistoryFiltersContextKey)

  if (!context) {
    throw new Error('useMatchHistoryFilters must be used within a player tab component')
  }

  return context
}
