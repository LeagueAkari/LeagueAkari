<template>
  <div class="flex items-center gap-1">
    <NSelect
      :disabled="isPaginationDisabled"
      :value="currentPageSize"
      @update:value="loadMatchHistory({ count: $event, startIndex: 0 })"
      size="small"
      :options="pageSizeOptions"
      class="mr-2"
    />

    <NButton
      size="small"
      tertiary
      circle
      :disabled="isFirstPage || isPaginationDisabled"
      :title="t('PlayerTab.prevPage')"
      @click="handlePrevPage"
    >
      <template #icon>
        <NIcon size="16"><ChevronLeft20Regular /></NIcon>
      </template>
    </NButton>

    <NPopover
      v-model:show="isArbitraryPagePopupVisible"
      trigger="click"
      :disabled="isPaginationDisabled"
    >
      <template #trigger>
        <span class="min-w-6 cursor-pointer text-center text-sm text-black dark:text-white/80">
          {{ computedCurrentPage }}
        </span>
      </template>
      <div class="flex flex-col gap-2 p-1">
        <div class="text-xs text-black/60 dark:text-white/60">
          {{ t('PlayerTab.goToPage') }}
        </div>
        <div class="flex items-center gap-2">
          <NInputNumber
            class="w-28!"
            size="small"
            v-model:value="arbitraryPage"
            :disabled="isPaginationDisabled"
            :min="1"
            @keyup.enter="handleGoToArbitraryPage"
          />
          <NButton
            size="small"
            secondary
            circle
            :disabled="isPaginationDisabled"
            @click="handleGoToArbitraryPage"
          >
            <template #icon>
              <NIcon size="16"><ArrowCircleRight32Filled /></NIcon>
            </template>
          </NButton>
          <NButton
            size="small"
            tertiary
            circle
            :disabled="isPaginationDisabled || isFirstPage"
            :title="t('PlayerTab.firstPage')"
            @click="handleGoToFirstPage"
          >
            <template #icon>
              <NIcon size="14"><Previous20Filled /></NIcon>
            </template>
          </NButton>
        </div>
      </div>
    </NPopover>

    <NButton
      size="small"
      tertiary
      circle
      :title="t('PlayerTab.nextPage')"
      @click="handleNextPage"
      :disabled="isPaginationDisabled"
    >
      <template #icon>
        <NIcon size="16"><ChevronRight20Regular /></NIcon>
      </template>
    </NButton>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Previous20Filled
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NPopover, NSelect } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { useMatchHistory } from '../../data/match-history'

const { t } = useTranslation()

const pts = usePlayerTabsStore()
const pageSizeOptions = usePageSizeOptions()
const { isLoading, loadMatchHistory, page, collectState } = useMatchHistory()

const isPaginationDisabled = computed(() => isLoading.value || !!collectState.value)

const computedCurrentPage = computed(() => {
  if (!page.value) return 1

  const {
    queryParams: { startIndex = 0, count = pts.frontendSettings.loadCount }
  } = page.value

  return Math.floor(startIndex / count) + 1
})

const currentPageSize = computed(
  () => page.value?.queryParams.count ?? pts.frontendSettings.loadCount
)
const isFirstPage = computed(() => computedCurrentPage.value <= 1)

const handlePrevPage = () => {
  loadMatchHistory({
    startIndex: (computedCurrentPage.value - 2) * currentPageSize.value
  })
}

const handleNextPage = () => {
  loadMatchHistory({
    startIndex: computedCurrentPage.value * currentPageSize.value
  })
}

const arbitraryPage = ref(computedCurrentPage.value)
const isArbitraryPagePopupVisible = ref(false)

watchEffect(() => {
  if (isArbitraryPagePopupVisible.value) {
    arbitraryPage.value = computedCurrentPage.value
  }
})

const handleGoToArbitraryPage = () => {
  if (isPaginationDisabled.value) {
    return
  }

  loadMatchHistory({
    startIndex: (arbitraryPage.value - 1) * currentPageSize.value
  })
}

const handleGoToFirstPage = () => {
  if (isPaginationDisabled.value) {
    return
  }

  loadMatchHistory({ startIndex: 0 })
}
</script>
