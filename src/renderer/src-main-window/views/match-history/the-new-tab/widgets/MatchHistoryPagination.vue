<template>
  <!-- 横向布局模式 -->
  <div
    v-if="horizontal"
    class="flex items-center gap-2 px-2 py-1 transition-colors rounded"
    :class="{
      'dark:bg-neutral-800 rounded bg-neutral-200 shadow-xl shadow-neutral-300 dark:shadow-neutral-800/60':
        isFloating,
      'dark:bg-white/5 bg-black/5': !isFloating
    }"
  >
    <!-- 队列选择器 -->
    <NSelect
      v-if="preferredSource === 'sgp' || isCrossRegion"
      :value="selectedQueue"
      @update:value="loadMatchHistory({ tag: $event === ALL_SGPTAG_VALUE ? undefined : $event })"
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
      class="!w-36"
    />

    <!-- 每页条数 -->
    <NSelect
      :disabled="isLoading"
      :value="pagedMatchHistory?.queryParams.count ?? mhs.frontendSettings.loadCount"
      @update:value="loadMatchHistory({ count: $event })"
      size="small"
      :options="pageSizeOptions"
      class="!w-28"
    />

    <!-- 翻页 -->
    <div class="flex items-center gap-1">
      <NButton
        size="small"
        tertiary
        circle
        :disabled="isFirstPage || isLoading"
        @click="
          loadMatchHistory({
            startIndex: (computedCurrentPage - 2) * mhs.frontendSettings.loadCount,
            count: mhs.frontendSettings.loadCount
          })
        "
      >
        <template #icon>
          <NIcon size="16"><ChevronLeft20Regular /></NIcon>
        </template>
      </NButton>
      <span class="text-sm text-black dark:text-white/80 min-w-32px text-center">
        {{ computedCurrentPage }}
      </span>
      <NButton
        size="small"
        tertiary
        circle
        @click="
          loadMatchHistory({
            startIndex: computedCurrentPage * mhs.frontendSettings.loadCount,
            count: mhs.frontendSettings.loadCount
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
      'dark:bg-neutral-800 rounded bg-neutral-200 shadow-xl shadow-neutral-300 dark:shadow-neutral-800/60':
        isFloating,
      'dark:bg-white/5 bg-black/5': !isFloating
    }"
    class="space-y-2 px-4 py-3 transition-colors rounded"
  >
    <!-- 队列选择器 - 始终可见 -->
    <NSelect
      v-if="preferredSource === 'sgp' || isCrossRegion"
      :value="selectedQueue"
      @update:value="loadMatchHistory({ tag: $event === ALL_SGPTAG_VALUE ? undefined : $event })"
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
    />

    <!-- 更多筛选 + 翻页 -->
    <div class="flex items-center justify-between">
      <NSelect
        :disabled="isLoading"
        :value="pagedMatchHistory?.queryParams.count ?? mhs.frontendSettings.loadCount"
        @update:value="loadMatchHistory({ count: $event })"
        size="small"
        :options="pageSizeOptions"
        class="!w-34"
      />

      <!-- 翻页 -->
      <div class="flex items-center gap-1">
        <NButton
          size="small"
          tertiary
          circle
          :disabled="isFirstPage || isLoading"
          @click="
            loadMatchHistory({
              startIndex: (computedCurrentPage - 2) * mhs.frontendSettings.loadCount,
              count: mhs.frontendSettings.loadCount
            })
          "
        >
          <template #icon>
            <NIcon size="16"><ChevronLeft20Regular /></NIcon>
          </template>
        </NButton>
        <span class="text-sm text-black dark:text-white/80 min-w-32px text-center">
          {{ computedCurrentPage }}
        </span>
        <NButton
          size="small"
          tertiary
          circle
          @click="
            loadMatchHistory({
              startIndex: computedCurrentPage * mhs.frontendSettings.loadCount,
              count: mhs.frontendSettings.loadCount
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
import { ChevronLeft20Regular, ChevronRight20Regular } from '@vicons/fluent'
import { NButton, NIcon, NSelect } from 'naive-ui'
import { computed } from 'vue'

import { usePageSizeOptions } from '@main-window/shards/match-history-tabs'
import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'

const { isFloating = false, horizontal = false } = defineProps<{
  horizontal?: boolean
  isFloating?: boolean
}>()

const mhs = useMatchHistoryTabsStore()
const sgpTagOptions = useSgpTagOptions()
const pageSizeOptions = usePageSizeOptions()

const { preferredSource, isCrossRegion } = usePlayerTab()
const { isLoading, loadMatchHistory, pagedMatchHistory } = useMatchHistory()

const computedCurrentPage = computed(() => {
  if (!pagedMatchHistory.value) return 1

  const {
    queryParams: { startIndex = 0, count = mhs.frontendSettings.loadCount }
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
</script>
