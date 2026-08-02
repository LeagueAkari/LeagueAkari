<template>
  <div
    class="match-history-pagination flex flex-col gap-3 rounded px-4 py-3 transition-colors @[480px]:ml-auto @[480px]:w-fit @[480px]:flex-row @[480px]:items-center @[480px]:gap-2 @[480px]:px-2 @[480px]:py-1"
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
  >
    <div v-if="isSgpMatchHistorySource" class="flex flex-col gap-2 @[480px]:block">
      <TooltipWithIcon
        class="text-xs text-black/60 @[480px]:hidden! dark:text-white/60"
        :tooltip="t('playerTabs.profile.sgpQueueOnlyTooltip')"
      >
        {{ t('playerTabs.profile.queue') }}
      </TooltipWithIcon>
      <QueueSelect :disabled="isPaginationDisabled" />
    </div>

    <div class="flex flex-col gap-2 @[480px]:block">
      <div class="text-xs text-black/60 @[480px]:hidden dark:text-white/60">
        {{ t('playerTabs.matchHistory.pagination') }}
      </div>
      <PageControls />
    </div>

    <div class="flex flex-col gap-2">
      <div class="text-xs text-black/60 @[480px]:hidden dark:text-white/60">
        {{ t('playerTabs.matchHistory.filters.title') }}
      </div>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <PageFilterControl
          :active="filterActive"
          :disabled="isPaginationDisabled"
          @open-filter="$emit('openFilter')"
          @clear-filters="$emit('clearFilters')"
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
import PageControls from './PageControls.vue'
import PageFilterControl from './PageFilterControl.vue'
import QueueSelect from './QueueSelect.vue'

defineProps<{
  isFloating: boolean
  filterActive: boolean
}>()

defineEmits<{
  openFilter: []
  clearFilters: []
}>()

const { t } = useTranslation()

const { preferredSource, isCrossRegion, sgpApiStatus } = usePlayerTab()
const { isLoading, collectState } = useMatchHistory()

const isPaginationDisabled = computed(() => isLoading.value || !!collectState.value)
const isSgpMatchHistorySource = computed(
  () => (preferredSource.value === 'sgp' || isCrossRegion.value) && sgpApiStatus.value.canUse
)
</script>
