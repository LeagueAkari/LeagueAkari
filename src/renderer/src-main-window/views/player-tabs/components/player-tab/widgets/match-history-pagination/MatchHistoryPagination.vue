<template>
  <div>
    <CollectModePagination
      v-if="isCollectModePage"
      :horizontal="horizontal"
      :is-floating="isFloating"
      :scanned-count="scannedCount"
      :collected-games-count="collectedGamesCount"
      :filter-active="filterButtonHasCombinator"
      :filter-disabled="isFilterActionDisabled"
      :exit-disabled="isCollectModeActionDisabled"
      @open-filter="handleOpenFilterModal"
      @exit="handleExitCollectMode"
    />

    <NormalPagination
      v-else
      :horizontal="horizontal"
      :is-floating="isFloating"
      :filter-active="filterButtonHasCombinator"
      @open-filter="handleOpenFilterModal"
      @clear-filters="handleClearFilters"
    />

    <NModal v-model:show="showFilterModal">
      <div class="h-187.5 max-h-[90vh] min-h-[75vh] w-225 max-w-[90vw]">
        <MatchHistoryFilters
          v-model:active-mode="modalActiveMode"
          v-model:simple-filter-state="modalSimpleFilterState"
          v-model:advanced-filter-state="modalAdvancedFilterState"
          @collect-begin="handleCollectBegin"
        />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../../context'
import { useMatchHistory } from '../../data/match-history'
import { useMatchHistoryFilters } from '../../data/match-history-filters'
import MatchHistoryFilters from '../match-history-filters/MatchHistoryFilters.vue'
import CollectModePagination from './CollectModePagination.vue'
import NormalPagination from './NormalPagination.vue'
import { useCollectModeFilterDraft } from './use-collect-mode-filter-draft'

const { isFloating = false, horizontal = false } = defineProps<{
  horizontal?: boolean
  isFloating?: boolean
}>()

const { preferredSource, isCrossRegion } = usePlayerTab()
const { isLoading, loadMatchHistory, page, collectState } = useMatchHistory()
const {
  activeMode,
  simpleFilterState,
  advancedFilterState,
  rootHasCombinator,
  setActiveMode,
  setSimpleFilterState,
  setAdvancedFilterState,
  clearPredicate
} = useMatchHistoryFilters()

const isCollectModePage = computed(() => page.value?.isLoadedByCollectMode ?? false)
const collectedGamesCount = computed(() => page.value?.games.length ?? 0)
const scannedCount = computed(
  () => page.value?.collectModeStats?.scannedGamesCount ?? collectedGamesCount.value
)
const isCollectModeActionDisabled = computed(() => isLoading.value || !!collectState.value)
const isFilterActionDisabled = computed(() => isLoading.value || !!collectState.value)
const isSgpMatchHistorySource = computed(
  () => preferredSource.value === 'sgp' || isCrossRegion.value
)

const {
  filterButtonHasCombinator,
  modalActiveMode,
  modalSimpleFilterState,
  modalAdvancedFilterState,
  prepareFilterModal,
  saveCollectModeFilterDraft,
  clearCollectModeFilterDraft
} = useCollectModeFilterDraft({
  isCollectModePage,
  isSgpMatchHistorySource,
  activeMode,
  simpleFilterState,
  advancedFilterState,
  rootHasCombinator,
  setActiveMode,
  setSimpleFilterState,
  setAdvancedFilterState
})

const showFilterModal = ref(false)

const handleOpenFilterModal = () => {
  if (isFilterActionDisabled.value) {
    return
  }

  prepareFilterModal()
  showFilterModal.value = true
}

const handleClearFilters = () => {
  if (isLoading.value || collectState.value) {
    return
  }

  showFilterModal.value = false
  clearPredicate()
}

const handleCollectBegin = () => {
  saveCollectModeFilterDraft()
  showFilterModal.value = false
}

const handleExitCollectMode = () => {
  if (isCollectModeActionDisabled.value) {
    return
  }

  clearCollectModeFilterDraft()
  clearPredicate()
  loadMatchHistory()
}
</script>
