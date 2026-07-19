import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import {
  MatchHistoryFilterMode,
  createEmptySimpleState,
  createEmptyState,
  toFilterState
} from '../match-history-filters/filter-state'
import { useCollectModeFilterDraft } from './use-collect-mode-filter-draft'

describe('useCollectModeFilterDraft', () => {
  it('uses the synchronized advanced filter state when collection begins', () => {
    const activeMode = ref<MatchHistoryFilterMode>('simple')
    const simpleFilterState = shallowRef(createEmptySimpleState())
    const advancedFilterState = shallowRef(createEmptyState())

    const draft = useCollectModeFilterDraft({
      isCollectModePage: computed(() => true),
      isSgpMatchHistorySource: ref(true),
      activeMode,
      simpleFilterState,
      advancedFilterState,
      rootHasCombinator: computed(() => false),
      setActiveMode: (mode) => (activeMode.value = mode),
      setSimpleFilterState: (state) => (simpleFilterState.value = state),
      setAdvancedFilterState: (state) => (advancedFilterState.value = state)
    })

    draft.prepareFilterModal()
    draft.modalSimpleFilterState.value = {
      ...createEmptySimpleState(),
      championIds: [1]
    }

    const synchronizedFilterState = toFilterState(
      {
        ...createEmptySimpleState(),
        championIds: [2]
      },
      'current-puuid'
    )
    activeMode.value = 'advanced'
    advancedFilterState.value = synchronizedFilterState

    draft.saveCollectModeFilterDraft()

    expect(draft.modalActiveMode.value).toBe('advanced')
    expect(draft.modalAdvancedFilterState.value).toEqual(synchronizedFilterState)
    expect(draft.modalSimpleFilterState.value).toEqual(createEmptySimpleState())
  })
})
