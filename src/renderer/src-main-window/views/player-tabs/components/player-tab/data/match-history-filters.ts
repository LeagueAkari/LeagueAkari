import { InjectionKey, Ref, computed, inject, provide, ref } from 'vue'

export type MatchHistoryFilters = {
  winLoss: 'all' | 'win' | 'loss'
  selectedChampions: number[]
  selectedSummoners: string[]
  showPractice: boolean
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
  const filters = ref<MatchHistoryFilters>({
    winLoss: 'all',
    selectedChampions: [],
    selectedSummoners: [],
    showPractice: false
  })

  const hasFilters = computed(() => {
    return (
      filters.value.winLoss !== 'all' ||
      filters.value.selectedChampions.length > 0 ||
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
}

export function useMatchHistoryFilters() {
  const context = inject(MatchHistoryFiltersContextKey)

  if (!context) {
    throw new Error('useMatchHistoryFilters must be used within a player tab component')
  }

  return context
}
