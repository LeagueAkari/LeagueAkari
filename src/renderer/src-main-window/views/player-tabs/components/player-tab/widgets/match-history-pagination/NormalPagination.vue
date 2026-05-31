<template>
  <div
    v-if="horizontal"
    class="match-history-pagination flex items-center gap-2 rounded px-2 py-1 transition-colors"
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
  >
    <QueueSelect v-if="isSgpMatchHistorySource" :disabled="isPaginationDisabled" horizontal />

    <FilterButton
      :active="filterActive"
      :disabled="isPaginationDisabled"
      @click="$emit('openFilter')"
    />

    <ClearFiltersButton
      :active="filterActive"
      :disabled="!filterActive || isPaginationDisabled"
      @click="$emit('clearFilters')"
    />
  </div>

  <div
    v-else
    class="match-history-pagination space-y-3 rounded px-4 py-3 transition-colors"
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
  >
    <div class="space-y-2" v-if="isSgpMatchHistorySource">
      <TooltipWithIcon
        class="mb-2 text-xs text-black/60 dark:text-white/60"
        :tooltip="t('PlayerTab.sgpQueueOnlyTooltip')"
      >
        {{ t('PlayerTab.queue') }}
      </TooltipWithIcon>
      <QueueSelect :disabled="isPaginationDisabled" />
    </div>

    <div class="space-y-2">
      <div class="text-xs text-black/60 dark:text-white/60">分页</div>
      <PageControls />
    </div>

    <div class="space-y-2">
      <div class="text-xs text-black/60 dark:text-white/60">筛选</div>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <FilterButton
          :active="filterActive"
          :disabled="isPaginationDisabled"
          @click="$emit('openFilter')"
        />

        <ClearFiltersButton
          :active="filterActive"
          :disabled="!filterActive || isPaginationDisabled"
          @click="$emit('clearFilters')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { usePlayerTab } from '../../context'
import { useMatchHistory } from '../../data/match-history'
import ClearFiltersButton from './ClearFiltersButton.vue'
import FilterButton from './FilterButton.vue'
import PageControls from './PageControls.vue'
import QueueSelect from './QueueSelect.vue'

defineProps<{
  horizontal: boolean
  isFloating: boolean
  filterActive: boolean
}>()

defineEmits<{
  openFilter: []
  clearFilters: []
}>()

const { t } = useTranslation()

const { preferredSource, isCrossRegion } = usePlayerTab()
const { isLoading, collectState } = useMatchHistory()

const isPaginationDisabled = computed(() => isLoading.value || !!collectState.value)
const isSgpMatchHistorySource = computed(
  () => preferredSource.value === 'sgp' || isCrossRegion.value
)
</script>
