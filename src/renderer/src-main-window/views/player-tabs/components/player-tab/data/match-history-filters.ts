import type { MatchParticipantPosition } from '@shared/data-adapter/match-history/participants'
import { InjectionKey, Ref, computed, inject, provide, ref } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

export const MATCH_HISTORY_POSITIONS: MatchParticipantPosition[] = [
  'TOP',
  'JUNGLE',
  'MIDDLE',
  'BOTTOM',
  'UTILITY'
]

export type MatchHistoryFilters = {
  winLoss: 'all' | 'win' | 'loss'
  selectedChampions: number[]
  selectedPositions: MatchParticipantPosition[]
  selectedSummoners: string[]
  showPractice: boolean
  showIrregularGames: boolean
}

export type MatchHistoryFiltersContext = {
  filters: Readonly<Ref<MatchHistoryFilters>>
  hasFilters: Readonly<Ref<boolean>>
  setFilters: (filters: MatchHistoryFilters) => void
}

export const MatchHistoryFiltersContextKey: InjectionKey<MatchHistoryFiltersContext> = Symbol(
  'PlayerTabMatchHistoryFiltersContext'
)

export function provideMatchHistoryFilters() {
  const pts = usePlayerTabsStore()

  const filters = ref<MatchHistoryFilters>({
    winLoss: 'all',
    selectedChampions: [],
    selectedPositions: [],
    selectedSummoners: [],
    showPractice: pts.frontendSettings.defaultShowPractice,
    showIrregularGames: pts.frontendSettings.defaultShowIrregularGames
  })

  const hasFilters = computed(() => {
    return (
      filters.value.winLoss !== 'all' ||
      filters.value.selectedChampions.length > 0 ||
      filters.value.selectedPositions.length > 0 ||
      filters.value.selectedSummoners.length > 0
    )
  })

  provide(MatchHistoryFiltersContextKey, {
    filters,
    hasFilters,
    setFilters: (filters0: MatchHistoryFilters) => {
      filters.value = filters0
    }
  })

  return {
    filters,
    hasFilters,
    setFilters: (filters0: MatchHistoryFilters) => {
      filters.value = filters0
    }
  }
}

export function useMatchHistoryFilters() {
  const context = inject(MatchHistoryFiltersContextKey)

  if (!context) {
    throw new Error('useMatchHistoryFilters must be used within a player tab component')
  }

  return context
}
