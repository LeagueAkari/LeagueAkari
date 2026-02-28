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
      @update:value="handleTagChange"
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
      class="w-56!"
      :render-label="renderLabel"
      :consistent-menu-width="false"
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

    <NButton
      size="small"
      :secondary="rootHasCombinator"
      :tertiary="!rootHasCombinator"
      circle
      :type="rootHasCombinator ? 'primary' : 'default'"
      :title="t('PlayerTab.filter.title')"
      @click="handleOpenFilterModal"
    >
      <template #icon>
        <NIcon size="16"><Filter20Regular /></NIcon>
      </template>
    </NButton>

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
        <div class="flex flex-col gap-2 p-1">
          <div class="text-xs text-black/60 dark:text-white/60">
            {{ t('PlayerTab.goToPage') }}
          </div>
          <div class="flex items-center gap-2">
            <NInputNumber
              class="w-28!"
              size="small"
              v-model:value="arbitraryPage"
              :disabled="isLoading"
              :min="1"
              @keyup.enter="handleGoToArbitraryPage"
            />
            <NButton
              size="small"
              secondary
              circle
              :disabled="isLoading"
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
              :disabled="isLoading || isFirstPage"
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

    <NModal v-model:show="showFilterModal">
      <div class="h-[750px] max-h-[90vh] min-h-[75vh] w-[800px] max-w-[90vw]">
        <MatchHistoryFilters />
      </div>
    </NModal>
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
      @update:value="handleTagChange"
      size="small"
      :options="sgpTagOptions"
      :disabled="isLoading"
      :render-label="renderLabel"
      :consistent-menu-width="false"
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

      <NButton
        size="small"
        :secondary="rootHasCombinator"
        :tertiary="!rootHasCombinator"
        circle
        :type="rootHasCombinator ? 'primary' : 'default'"
        :title="t('PlayerTab.filter.title')"
        @click="handleOpenFilterModal"
      >
        <template #icon>
          <NIcon size="16"><Filter20Regular /></NIcon>
        </template>
      </NButton>

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
          <div class="flex flex-col gap-2 p-1">
            <div class="text-xs text-black/60 dark:text-white/60">
              {{ t('PlayerTab.goToPage') }}
            </div>
            <div class="flex items-center gap-2">
              <NInputNumber
                class="w-28!"
                size="small"
                v-model:value="arbitraryPage"
                :disabled="isLoading"
                :min="1"
                @keyup.enter="handleGoToArbitraryPage"
              />
              <NButton
                size="small"
                secondary
                circle
                :disabled="isLoading"
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
                :disabled="isLoading || isFirstPage"
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

    <NModal v-model:show="showFilterModal">
      <div class="h-[700px] max-h-[90vh] min-h-[75vh] w-[1000px] max-w-[90vw]">
        <MatchHistoryFilters />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Filter20Regular,
  Previous20Filled
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NModal, NPopover, NSelect, SelectOption } from 'naive-ui'
import { computed, h, ref, watchEffect } from 'vue'

import { useMapAssets } from '@main-window/composables/useMapAssets'
import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'
import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import MatchHistoryFilters from './match-history-filters/MatchHistoryFilters.vue'

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

const handleTagChange = (tag: string) => {
  pts.frontendSettings.defaultMatchHistoryTag = tag
  loadMatchHistory({ tag: tag === ALL_SGPTAG_VALUE ? undefined : tag, startIndex: 0 })
}

const { rootHasCombinator } = useMatchHistoryFilters()

const arbitraryPage = ref(computedCurrentPage.value)
const isArbitraryPagePopupVisible = ref(false)

watchEffect(() => {
  if (isArbitraryPagePopupVisible.value) {
    arbitraryPage.value = computedCurrentPage.value
  }
})

const handleGoToArbitraryPage = () => {
  loadMatchHistory({
    startIndex:
      (arbitraryPage.value - 1) *
      (pagedMatchHistory.value?.queryParams.count ?? pts.frontendSettings.loadCount)
  })
}

const handleGoToFirstPage = () => {
  loadMatchHistory({ startIndex: 0 })
}

const mapAssets = useMapAssets()
const shs = useSelfHostedLcuDataStore()

const mapIdGameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return {}
  }

  const uriMap: Record<string, string> = {}

  for (const [mapId, mapAsset] of Object.entries(mapAssets.value)) {
    for (const item of mapAsset) {
      const key = `${mapId}_${item.gameMode}`

      if (uriMap[key]) {
        continue
      }

      uriMap[key] = item.assets?.['game-select-icon-hover']
    }
  }

  return uriMap
})

const getQueueMapIconUri = (queueId: number | undefined) => {
  if (!queueId) {
    return mapIdGameModeIconUri.value['11_CLASSIC']
  }

  const queue = shs.gameQueues[queueId]

  if (queue) {
    return (
      mapIdGameModeIconUri.value[`${queue.mapId}_${queue.gameMode}`] ??
      mapIdGameModeIconUri.value['11_CLASSIC']
    )
  } else {
    return mapIdGameModeIconUri.value['11_CLASSIC']
  }
}

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return h('span', option.label as string)
  }

  const value = option.value as string
  const [_, queueId] = value.split('q_')

  return h(
    'div',
    {
      class: 'flex items-center gap-2'
    },
    [
      h(LcuImage, {
        src: getQueueMapIconUri(queueId ? parseInt(queueId) : undefined),
        class: 'size-5 rounded'
      }),
      h('span', { class: 'text-sm' }, option.label as string)
    ]
  )
}

const showFilterModal = ref(false)
const handleOpenFilterModal = () => {
  showFilterModal.value = true
}
</script>
