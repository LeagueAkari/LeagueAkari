import { ComputedRef, Ref, computed, ref, shallowRef } from 'vue'

import {
  MatchHistoryFilterMode,
  MatchHistoryFilterState,
  SimpleMatchHistoryFilterState,
  createEmptySimpleState,
  createEmptyState,
  hasPredicate,
  hasSimplePredicate
} from '../match-history-filters/filter-state'

export type MatchHistoryFilterDraft = {
  activeMode: MatchHistoryFilterMode
  simpleFilterState: SimpleMatchHistoryFilterState
  advancedFilterState: MatchHistoryFilterState
}

const cloneState = <T>(state: T): T => structuredClone(state)

export function useCollectModeFilterDraft(props: {
  isCollectModePage: ComputedRef<boolean>
  isSgpMatchHistorySource: ComputedRef<boolean>
  activeMode: Readonly<Ref<MatchHistoryFilterMode>>
  simpleFilterState: Readonly<Ref<SimpleMatchHistoryFilterState>>
  advancedFilterState: Readonly<Ref<MatchHistoryFilterState>>
  rootHasCombinator: ComputedRef<boolean>
  setActiveMode: (mode: MatchHistoryFilterMode) => void
  setSimpleFilterState: (state: SimpleMatchHistoryFilterState) => void
  setAdvancedFilterState: (state: MatchHistoryFilterState) => void
}) {
  const collectModeFilterDraft = shallowRef<MatchHistoryFilterDraft | null>(null)
  const modalFilterDraft = shallowRef<MatchHistoryFilterDraft | null>(null)
  const isFilterModalCollectDraftMode = ref(false)

  const createCurrentFilterDraft = (): MatchHistoryFilterDraft => ({
    activeMode: props.activeMode.value,
    simpleFilterState: cloneState(props.simpleFilterState.value),
    advancedFilterState: cloneState(props.advancedFilterState.value)
  })

  const cloneFilterDraft = (draft: MatchHistoryFilterDraft): MatchHistoryFilterDraft => ({
    activeMode: draft.activeMode,
    simpleFilterState: cloneState(draft.simpleFilterState),
    advancedFilterState: cloneState(draft.advancedFilterState)
  })

  const normalizeCollectFilterDraft = (draft: MatchHistoryFilterDraft): MatchHistoryFilterDraft => {
    if (draft.activeMode === 'simple') {
      return {
        ...cloneFilterDraft(draft),
        advancedFilterState: createEmptyState()
      }
    }

    return {
      ...cloneFilterDraft(draft),
      simpleFilterState: createEmptySimpleState()
    }
  }

  const hasFilterDraftPredicate = (draft: MatchHistoryFilterDraft) => {
    return draft.activeMode === 'simple'
      ? hasSimplePredicate(draft.simpleFilterState, {
          enablePosition: props.isSgpMatchHistorySource.value
        })
      : hasPredicate(draft.advancedFilterState)
  }

  const filterButtonHasCombinator = computed(() => {
    if (!props.isCollectModePage.value || !collectModeFilterDraft.value) {
      return props.rootHasCombinator.value
    }

    return hasFilterDraftPredicate(collectModeFilterDraft.value)
  })

  const ensureModalFilterDraft = () => {
    if (!modalFilterDraft.value) {
      modalFilterDraft.value = cloneFilterDraft(
        collectModeFilterDraft.value ?? createCurrentFilterDraft()
      )
    }

    return modalFilterDraft.value
  }

  const updateModalFilterDraft = (patch: Partial<MatchHistoryFilterDraft>) => {
    modalFilterDraft.value = {
      ...ensureModalFilterDraft(),
      ...patch
    }
  }

  const modalActiveMode = computed<MatchHistoryFilterMode>({
    get: () =>
      isFilterModalCollectDraftMode.value
        ? ensureModalFilterDraft().activeMode
        : props.activeMode.value,
    set: (nextActiveMode) => {
      if (isFilterModalCollectDraftMode.value) {
        updateModalFilterDraft({ activeMode: nextActiveMode })
      } else {
        props.setActiveMode(nextActiveMode)
      }
    }
  })

  const modalSimpleFilterState = computed<SimpleMatchHistoryFilterState>({
    get: () =>
      isFilterModalCollectDraftMode.value
        ? ensureModalFilterDraft().simpleFilterState
        : props.simpleFilterState.value,
    set: (nextSimpleFilterState) => {
      if (isFilterModalCollectDraftMode.value) {
        updateModalFilterDraft({ simpleFilterState: nextSimpleFilterState })
      } else {
        props.setSimpleFilterState(nextSimpleFilterState)
      }
    }
  })

  const modalAdvancedFilterState = computed<MatchHistoryFilterState>({
    get: () =>
      isFilterModalCollectDraftMode.value
        ? ensureModalFilterDraft().advancedFilterState
        : props.advancedFilterState.value,
    set: (nextAdvancedFilterState) => {
      if (isFilterModalCollectDraftMode.value) {
        updateModalFilterDraft({ advancedFilterState: nextAdvancedFilterState })
      } else {
        props.setAdvancedFilterState(nextAdvancedFilterState)
      }
    }
  })

  const prepareFilterModal = () => {
    isFilterModalCollectDraftMode.value = props.isCollectModePage.value

    if (isFilterModalCollectDraftMode.value) {
      if (!collectModeFilterDraft.value) {
        collectModeFilterDraft.value = createCurrentFilterDraft()
      }

      modalFilterDraft.value = cloneFilterDraft(collectModeFilterDraft.value)
    } else {
      modalFilterDraft.value = null
    }
  }

  const saveCollectModeFilterDraft = () => {
    const nextCollectModeFilterDraft =
      isFilterModalCollectDraftMode.value && modalFilterDraft.value
        ? cloneFilterDraft(modalFilterDraft.value)
        : createCurrentFilterDraft()

    collectModeFilterDraft.value = normalizeCollectFilterDraft(nextCollectModeFilterDraft)
    modalFilterDraft.value = cloneFilterDraft(collectModeFilterDraft.value)
  }

  const clearCollectModeFilterDraft = () => {
    collectModeFilterDraft.value = null
    modalFilterDraft.value = null
    isFilterModalCollectDraftMode.value = false
  }

  return {
    filterButtonHasCombinator,
    modalActiveMode,
    modalSimpleFilterState,
    modalAdvancedFilterState,
    prepareFilterModal,
    saveCollectModeFilterDraft,
    clearCollectModeFilterDraft
  }
}
