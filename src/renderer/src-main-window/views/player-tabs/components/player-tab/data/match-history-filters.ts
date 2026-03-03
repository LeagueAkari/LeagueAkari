import type { MatchParticipantPosition } from '@shared/data-adapter/match-history/participants'
import { Predicate } from '@shared/data-adapter/predicates/combinators'
import { ComputedRef, InjectionKey, Ref, computed, inject, markRaw, provide, ref, watch } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import {
  CombinatorNode,
  GameCombinator,
  collectSubtreeNodeIds,
  nodeArg
} from '../widgets/match-history-filters/combinator-nodes'
import { toPredicate } from '../widgets/match-history-filters/combinator-runtime'

export const MATCH_HISTORY_POSITIONS: MatchParticipantPosition[] = [
  'TOP',
  'JUNGLE',
  'MIDDLE',
  'BOTTOM',
  'UTILITY'
]

export type MatchHistoryFilterMode = 'simple' | 'advanced'

export type MatchHistorySimpleFilters = {
  winLoss: 'all' | 'win' | 'loss'
  selectedChampions: number[]
  selectedPositions: MatchParticipantPosition[]
  selectedSummoners: string[]
  showPractice: boolean
  showIrregularGames: boolean
}

export type SimpleSummonerResult = {
  puuid: string
  profileIconId: number
  gameName: string
  tagLine: string
}

export type MatchHistoryFiltersContext = {
  mode: Ref<MatchHistoryFilterMode>
  filters: Readonly<Ref<MatchHistorySimpleFilters>>
  hasFilters: Readonly<Ref<boolean>>
  hasActiveFilters: Readonly<Ref<boolean>>
  rootNode: ComputedRef<CombinatorNode>
  nodeMap: Ref<Record<string, CombinatorNode>>
  predicate: ComputedRef<Predicate<unknown>>
  rootHasCombinator: ComputedRef<boolean>
  cachedSummoners: Ref<Record<string, SimpleSummonerResult>>
  setMode: (mode: MatchHistoryFilterMode, options?: { persist?: boolean }) => void
  setFilters: (filters: MatchHistorySimpleFilters) => void
  clearSimpleFilters: () => void
  addNode: (node: CombinatorNode) => void
  updateNode: (id: string, node: CombinatorNode) => void
  deleteNode: (id: string) => void
  saveSummoner: (puuid: string, summoner: SimpleSummonerResult) => void
  clearAdvancedFilters: () => void
  clearFilters: () => void
}

export const MatchHistoryFiltersContextKey: InjectionKey<MatchHistoryFiltersContext> = Symbol(
  'PlayerTabMatchHistoryFiltersContext'
)

const ROOT_ID = 'game'

function createInitialSimpleFilters(
  showPractice: boolean,
  showIrregularGames: boolean
): MatchHistorySimpleFilters {
  return {
    winLoss: 'all',
    selectedChampions: [],
    selectedPositions: [],
    selectedSummoners: [],
    showPractice,
    showIrregularGames
  }
}

export function provideMatchHistoryFilters() {
  const pts = usePlayerTabsStore()

  const filters = ref<MatchHistorySimpleFilters>(
    createInitialSimpleFilters(
      pts.frontendSettings.defaultShowPractice,
      pts.frontendSettings.defaultShowIrregularGames
    )
  )

  const hasFilters = computed(() => {
    return (
      filters.value.winLoss !== 'all' ||
      filters.value.selectedChampions.length > 0 ||
      filters.value.selectedPositions.length > 0 ||
      filters.value.selectedSummoners.length > 0
    )
  })

  const nodeMap = ref<Record<string, CombinatorNode>>({
    game: {
      id: ROOT_ID,
      type: ROOT_ID,
      args: [nodeArg(null)],
      parentId: null
    }
  })

  const mode = ref<MatchHistoryFilterMode>(
    pts.frontendSettings.defaultMatchHistoryFilterMode ?? 'simple'
  )
  const rootNode = computed<GameCombinator>(() => nodeMap.value[ROOT_ID] as GameCombinator)
  const predicate = computed(() => toPredicate(ROOT_ID, nodeMap.value) as Predicate<unknown>)

  const rootHasCombinator = computed(() => {
    return rootNode.value.args[0].value !== null
  })

  const hasActiveFilters = computed(() => {
    return mode.value === 'advanced' ? rootHasCombinator.value : hasFilters.value
  })

  const setFilters = (filters0: MatchHistorySimpleFilters) => {
    filters.value = filters0
  }

  const clearSimpleFilters = () => {
    filters.value = createInitialSimpleFilters(false, false)
  }

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

  const clearAdvancedFilters = () => {
    if (rootNode.value.args[0].value) {
      deleteNode(rootNode.value.args[0].value)
    }

    cachedSummoners.value = {}
  }

  watch(
    () => pts.frontendSettings.defaultMatchHistoryFilterMode,
    (nextMode) => {
      if (mode.value !== nextMode) {
        mode.value = nextMode
      }
    }
  )

  const setMode = (_mode: MatchHistoryFilterMode, options: { persist?: boolean } = {}) => {
    mode.value = _mode

    if (options.persist) {
      pts.frontendSettings.defaultMatchHistoryFilterMode = _mode
    }
  }

  const clearFilters = () => {
    if (mode.value === 'advanced') {
      clearAdvancedFilters()
      return
    }

    clearSimpleFilters()
  }

  provide(MatchHistoryFiltersContextKey, {
    mode,
    filters,
    hasFilters,
    hasActiveFilters,
    rootNode,
    nodeMap,
    rootHasCombinator,
    predicate,
    cachedSummoners,
    setMode,
    setFilters,
    clearSimpleFilters,
    saveSummoner,
    addNode,
    updateNode,
    deleteNode,
    clearAdvancedFilters,
    clearFilters
  })

  return {
    mode,
    filters,
    hasFilters,
    hasActiveFilters,
    rootNode,
    nodeMap,
    rootHasCombinator,
    predicate,
    cachedSummoners,
    setMode,
    setFilters,
    clearSimpleFilters,
    saveSummoner,
    addNode,
    updateNode,
    deleteNode,
    clearAdvancedFilters,
    clearFilters
  }
}

export function useMatchHistoryFilters() {
  const context = inject(MatchHistoryFiltersContextKey)

  if (!context) {
    throw new Error('useMatchHistoryFilters must be used within a player tab component')
  }

  return context
}
