<template>
  <!-- 横向布局模式 -->
  <div
    v-if="horizontal"
    class="flex items-center gap-2 rounded px-2 py-1 transition-colors"
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
  >
    <!-- 队列选择器 -->
    <NSelect
      v-if="preferredSource === 'sgp' || isCrossRegion"
      :value="selectedQueue"
      @update:value="
        loadMatchHistory({ tag: $event === ALL_SGPTAG_VALUE ? undefined : $event, startIndex: 0 })
      "
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
      class="w-56!"
    />

    <!-- 每页条数 -->
    <NSelect
      :disabled="isLoading"
      :value="pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount"
      @update:value="loadMatchHistory({ count: $event, startIndex: 0 })"
      size="small"
      :options="pageSizeOptions"
      class="w-28!"
    />

    <NPopover
      display-directive="show"
      trigger="click"
      placement="bottom"
      :theme-overrides="{ padding: '0px' }"
    >
      <template #trigger>
        <NButton
          size="small"
          :secondary="hasFilters"
          :tertiary="!hasFilters"
          circle
          :type="hasFilters ? 'primary' : 'default'"
          :title="t('PlayerTab.filter.title')"
        >
          <template #icon>
            <NIcon size="16"><Filter20Regular /></NIcon>
          </template>
        </NButton>
      </template>
      <MatchHistoryFilter class="w-[300px]" />
    </NPopover>

    <!-- 翻页 -->
    <div class="flex items-center gap-1">
      <NButton
        size="small"
        tertiary
        circle
        :disabled="isFirstPage || isLoading"
        :title="t('PlayerTab.prevPage')"
        @click="
          loadMatchHistory({
            startIndex:
              (computedCurrentPage - 2) *
              (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
          })
        "
      >
        <template #icon>
          <NIcon size="16"><ChevronLeft20Regular /></NIcon>
        </template>
      </NButton>

      <NPopover v-model:show="isArbitraryPagePopupVisible" trigger="click">
        <template #trigger>
          <span
            class="min-w-[24px] cursor-pointer text-center text-sm text-black dark:text-white/80"
          >
            {{ computedCurrentPage }}
          </span>
        </template>
        <div class="flex gap-2">
          <NInputNumber
            class="w-28!"
            size="small"
            v-model:value="arbitraryPage"
            :disabled="isLoading"
            :min="1"
            @keyup.enter="
              loadMatchHistory({
                startIndex:
                  (arbitraryPage - 1) *
                  (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
              })
            "
          />
          <NButton
            size="small"
            secondary
            circle
            :disabled="isLoading"
            @click="
              loadMatchHistory({
                startIndex:
                  (arbitraryPage - 1) *
                  (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
              })
            "
          >
            <template #icon>
              <NIcon size="16"><ArrowCircleRight32Filled /></NIcon>
            </template>
          </NButton>
        </div>
      </NPopover>

      <NButton
        size="small"
        tertiary
        circle
        :title="t('PlayerTab.nextPage')"
        @click="
          loadMatchHistory({
            startIndex:
              computedCurrentPage *
              (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
          })
        "
        :disabled="isLoading"
      >
        <template #icon>
          <NIcon size="16"><ChevronRight20Regular /></NIcon>
        </template>
      </NButton>
    </div>
  </div>

  <!-- 默认纵向布局模式 -->
  <div
    v-else
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
    class="space-y-2 rounded px-4 py-3 transition-colors"
  >
    <!-- 队列选择器 - 始终可见 -->
    <NSelect
      v-if="preferredSource === 'sgp' || isCrossRegion"
      :value="selectedQueue"
      @update:value="
        loadMatchHistory({ tag: $event === ALL_SGPTAG_VALUE ? undefined : $event, startIndex: 0 })
      "
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
    />

    <!-- 更多筛选 + 翻页 -->
    <div class="flex items-center justify-between gap-1">
      <NSelect
        :disabled="isLoading"
        :value="pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount"
        @update:value="loadMatchHistory({ count: $event, startIndex: 0 })"
        size="small"
        :options="pageSizeOptions"
      />

      <NPopover
        display-directive="show"
        trigger="click"
        placement="bottom"
        :theme-overrides="{ padding: '0px' }"
      >
        <template #trigger>
          <NButton
            size="small"
            :secondary="hasFilters"
            :tertiary="!hasFilters"
            circle
            :type="hasFilters ? 'primary' : 'default'"
            :title="t('PlayerTab.filter.title')"
          >
            <template #icon>
              <NIcon size="16"><Filter20Regular /></NIcon>
            </template>
          </NButton>
        </template>
        <MatchHistoryFilter class="w-[300px]" />
      </NPopover>

      <!-- 翻页 -->
      <div class="flex items-center gap-1">
        <NButton
          size="small"
          tertiary
          circle
          :disabled="isFirstPage || isLoading"
          :title="t('PlayerTab.prevPage')"
          @click="
            loadMatchHistory({
              startIndex:
                (computedCurrentPage - 2) *
                (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
            })
          "
        >
          <template #icon>
            <NIcon size="16"><ChevronLeft20Regular /></NIcon>
          </template>
        </NButton>

        <NPopover v-model:show="isArbitraryPagePopupVisible" trigger="click">
          <template #trigger>
            <span
              class="min-w-[24px] cursor-pointer text-center text-sm text-black dark:text-white/80"
            >
              {{ computedCurrentPage }}
            </span>
          </template>
          <div class="flex gap-2">
            <NInputNumber
              class="w-28!"
              size="small"
              v-model:value="arbitraryPage"
              :disabled="isLoading"
              :min="1"
              @keyup.enter="
                loadMatchHistory({
                  startIndex:
                    (arbitraryPage - 1) *
                    (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
                })
              "
            />
            <NButton
              size="small"
              secondary
              circle
              :disabled="isLoading"
              @click="
                loadMatchHistory({
                  startIndex:
                    (arbitraryPage - 1) *
                    (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
                })
              "
            >
              <template #icon>
                <NIcon size="16"><ArrowCircleRight32Filled /></NIcon>
              </template>
            </NButton>
          </div>
        </NPopover>

        <NButton
          size="small"
          tertiary
          circle
          :title="t('PlayerTab.nextPage')"
          @click="
            loadMatchHistory({
              startIndex:
                computedCurrentPage *
                (pagedMatchHistory?.queryParams.count ?? pts.frontendSettings.loadCount)
            })
          "
          :disabled="isLoading"
        >
          <template #icon>
            <NIcon size="16"><ChevronRight20Regular /></NIcon>
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Filter20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NPopover, NSelect } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import MatchHistoryFilter from './MatchHistoryFilter.vue'

const { isFloating = false, horizontal = false } = defineProps<{
  horizontal?: boolean
  isFloating?: boolean
}>()

const { t } = useTranslation()
const pts = usePlayerTabsStore()
const sgpTagOptions = useSgpTagOptions()
const pageSizeOptions = usePageSizeOptions()

const { preferredSource, isCrossRegion } = usePlayerTab()
const { isLoading, loadMatchHistory, pagedMatchHistory } = useMatchHistory()

const computedCurrentPage = computed(() => {
  if (!pagedMatchHistory.value) return 1

  const {
    queryParams: { startIndex = 0, count = pts.frontendSettings.loadCount }
  } = pagedMatchHistory.value

  return Math.floor(startIndex / count) + 1
})

const selectedQueue = computed(() => {
  if (!pagedMatchHistory.value) return ALL_SGPTAG_VALUE

  const {
    queryParams: { tag = ALL_SGPTAG_VALUE }
  } = pagedMatchHistory.value

  return tag
})

const isFirstPage = computed(() => computedCurrentPage.value <= 1)

const { hasFilters } = useMatchHistoryFilters()

const arbitraryPage = ref(computedCurrentPage.value)
const isArbitraryPagePopupVisible = ref(false)

watchEffect(() => {
  if (isArbitraryPagePopupVisible.value) {
    arbitraryPage.value = computedCurrentPage.value
  }
})
</script>
