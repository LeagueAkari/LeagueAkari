import { Predicate } from '@shared/data-adapter/predicates/combinators'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import {
  ComputedRef,
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  provide,
  ref,
  shallowRef,
  toRef
} from 'vue'

import {
  MatchHistoryFilterMode,
  MatchHistoryFilterState,
  SimpleMatchHistoryFilterState,
  clearSimplePredicate,
  clearPredicate as clearStatePredicate,
  createEmptySimpleState,
  createEmptyState,
  hasPredicate,
  hasSimplePredicate,
  toFilterState,
  toPredicate
} from '../widgets/match-history-filters/filter-state'

export type MatchHistoryFiltersContext = {
  filterState: ComputedRef<MatchHistoryFilterState>
  simpleFilterState: Ref<SimpleMatchHistoryFilterState>
  advancedFilterState: Ref<MatchHistoryFilterState>
  activeMode: Ref<MatchHistoryFilterMode>
  predicate: ComputedRef<Predicate<LcuOrSgpGameSummary>>
  rootHasCombinator: ComputedRef<boolean>
  setActiveMode: (mode: MatchHistoryFilterMode) => void
  setSimpleFilterState: (state: SimpleMatchHistoryFilterState) => void
  setAdvancedFilterState: (state: MatchHistoryFilterState) => void
  clearPredicate: () => void
}

export const MatchHistoryFiltersContextKey: InjectionKey<MatchHistoryFiltersContext> = Symbol(
  'PlayerTabMatchHistoryFiltersContext'
)

export function provideMatchHistoryFilters(props: {
  puuid: MaybeRefOrGetter<string>
  enablePositionFilter: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const enablePositionFilter = toRef(props.enablePositionFilter)
  const activeMode = ref<MatchHistoryFilterMode>('simple')
  const simpleFilterState = shallowRef(createEmptySimpleState())
  const advancedFilterState = shallowRef(createEmptyState())

  const filterState = computed(() =>
    activeMode.value === 'simple'
      ? toFilterState(simpleFilterState.value, puuid.value, {
          enablePosition: enablePositionFilter.value
        })
      : advancedFilterState.value
  )

  const predicate = computed(() => toPredicate(filterState.value))
  const rootHasCombinator = computed(() =>
    activeMode.value === 'simple'
      ? hasSimplePredicate(simpleFilterState.value, {
          enablePosition: enablePositionFilter.value
        })
      : hasPredicate(advancedFilterState.value)
  )

  const setActiveMode = (mode: MatchHistoryFilterMode) => {
    activeMode.value = mode
  }

  const setSimpleFilterState = (state: SimpleMatchHistoryFilterState) => {
    simpleFilterState.value = state
  }

  const setAdvancedFilterState = (state: MatchHistoryFilterState) => {
    advancedFilterState.value = state
  }

  const clearPredicate = () => {
    if (activeMode.value === 'simple') {
      simpleFilterState.value = clearSimplePredicate(simpleFilterState.value)
    } else {
      advancedFilterState.value = clearStatePredicate(advancedFilterState.value)
    }
  }

  provide(MatchHistoryFiltersContextKey, {
    filterState,
    simpleFilterState,
    advancedFilterState,
    activeMode,
    rootHasCombinator,
    predicate,
    setActiveMode,
    setSimpleFilterState,
    setAdvancedFilterState,
    clearPredicate
  })

  return {
    filterState,
    simpleFilterState,
    advancedFilterState,
    activeMode,
    rootHasCombinator,
    predicate,
    setActiveMode,
    setSimpleFilterState,
    setAdvancedFilterState,
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
