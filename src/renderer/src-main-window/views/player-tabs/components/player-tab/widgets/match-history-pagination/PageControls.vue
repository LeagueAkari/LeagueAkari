<template>
  <div class="flex items-center gap-1">
    <NSelect
      :disabled="isPaginationDisabled"
      :value="currentPageSize"
      @update:value="handlePageSizeChange"
      size="small"
      :options="pageSizeOptions"
      :render-label="renderPageSizeLabel"
      class="mr-2 @[480px]:hidden"
    />

    <NButton
      size="small"
      tertiary
      circle
      :disabled="isFirstPage || isPaginationDisabled"
      :title="t('playerTabs.profile.prevPage')"
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
          {{ t('playerTabs.profile.goToPage') }}
        </div>
        <div class="flex items-center gap-2">
          <NInputNumber
            class="w-28!"
            size="small"
            v-model:value="arbitraryPage"
            :disabled="isPaginationDisabled"
            :min="1"
            @keydown.enter="handleArbitraryPageEnter"
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
            :title="t('playerTabs.profile.firstPage')"
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
      :title="t('playerTabs.profile.nextPage')"
      @click="handleNextPage"
      :disabled="isPaginationDisabled"
    >
      <template #icon>
        <NIcon size="16"><ChevronRight20Regular /></NIcon>
      </template>
    </NButton>
  </div>
</template>

<script setup lang="tsx">
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Previous20Filled
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NPopover, NSelect, NTag, SelectRenderLabel } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import {
  MATCH_HISTORY_MAX_REGULAR_PAGE_SIZE,
  useMatchHistoryPageSizeOptions
} from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { useMatchHistory } from '../../data/match-history'

const { t } = useTranslation()

const pts = usePlayerTabsStore()
const { isLoading, loadMatchHistory, loadMatchHistoryByPageSize, page, collectState } =
  useMatchHistory()
const pageSizeOptions = useMatchHistoryPageSizeOptions()

const renderPageSizeLabel: SelectRenderLabel = (option) => {
  if ((option.value as number) <= MATCH_HISTORY_MAX_REGULAR_PAGE_SIZE) {
    return option.label as string
  }

  return (
    <div class="flex items-center gap-1.5">
      <NTag size="tiny" type="info" bordered={false}>
        {t('playerTabs.matchHistory.collectMode.pageSizeOptionTag')}
      </NTag>
      <span>{option.label as string}</span>
    </div>
  )
}

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

const handlePageSizeChange = (count: number) => {
  void loadMatchHistoryByPageSize(count)
}

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

const handleArbitraryPageEnter = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return
  }

  handleGoToArbitraryPage()
}

const handleGoToFirstPage = () => {
  if (isPaginationDisabled.value) {
    return
  }

  loadMatchHistory({ startIndex: 0 })
}
</script>
