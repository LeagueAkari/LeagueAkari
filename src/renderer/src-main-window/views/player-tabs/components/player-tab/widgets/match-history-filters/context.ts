import { ComputedRef, InjectionKey, Ref, computed, inject, provide } from 'vue'

import { CombinatorNode, GameCombinator } from './combinator-nodes'
import {
  MatchHistoryFilterState,
  SimpleSummonerResult,
  addNode,
  clearPredicate,
  deleteNode,
  getRootNode,
  hasPredicate,
  insertSiblingWithOr,
  saveSummoner,
  updateNode
} from './filter-state'

export type MatchHistoryFilterEditorContext = {
  state: Ref<MatchHistoryFilterState>
  rootNode: ComputedRef<GameCombinator>
  nodeMap: ComputedRef<Record<string, CombinatorNode>>
  rootHasCombinator: ComputedRef<boolean>
  cachedSummoners: ComputedRef<Record<string, SimpleSummonerResult>>
  setState: (nextState: MatchHistoryFilterState) => void
  addNode: (node: CombinatorNode) => void
  updateNode: (id: string, node: CombinatorNode) => void
  addNodeAndUpdateNode: (node: CombinatorNode, id: string, updatedNode: CombinatorNode) => void
  insertSiblingWithOr: (id: string, siblingNode: CombinatorNode) => void
  deleteNode: (id: string) => void
  saveSummoner: (puuid: string, summoner: SimpleSummonerResult) => void
  clearPredicate: () => void
}

export const MatchHistoryFilterEditorContextKey: InjectionKey<MatchHistoryFilterEditorContext> =
  Symbol('MatchHistoryFilterEditorContext')

export function provideMatchHistoryFilterEditor(state: Ref<MatchHistoryFilterState>) {
  const nodeMap = computed(() => state.value.nodeMap)
  const rootNode = computed(() => getRootNode(state.value))
  const rootHasCombinator = computed(() => hasPredicate(state.value))
  const cachedSummoners = computed(() => state.value.cachedSummoners)

  const context: MatchHistoryFilterEditorContext = {
    state,
    rootNode,
    nodeMap,
    rootHasCombinator,
    cachedSummoners,
    setState: (nextState) => {
      state.value = nextState
    },
    addNode: (node) => {
      state.value = addNode(state.value, node)
    },
    updateNode: (id, node) => {
      state.value = updateNode(state.value, id, node)
    },
    addNodeAndUpdateNode: (node, id, updatedNode) => {
      state.value = updateNode(addNode(state.value, node), id, updatedNode)
    },
    insertSiblingWithOr: (id, siblingNode) => {
      state.value = insertSiblingWithOr(state.value, id, siblingNode)
    },
    deleteNode: (id) => {
      state.value = deleteNode(state.value, id)
    },
    saveSummoner: (puuid, summoner) => {
      state.value = saveSummoner(state.value, puuid, summoner)
    },
    clearPredicate: () => {
      state.value = clearPredicate(state.value)
    }
  }

  provide(MatchHistoryFilterEditorContextKey, context)

  return context
}

export function useMatchHistoryFilterEditor() {
  const context = inject(MatchHistoryFilterEditorContextKey)

  if (!context) {
    throw new Error('useMatchHistoryFilterEditor must be used within MatchHistoryFilters')
  }

  return context
}
