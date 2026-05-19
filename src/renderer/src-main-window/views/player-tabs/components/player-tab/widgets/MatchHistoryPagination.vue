<template>
  <div
    v-if="horizontal && isCollectModePage"
    class="match-history-pagination border-akari-500/30 bg-akari-500/10 dark:border-akari-400/25 dark:bg-akari-400/10 flex items-center gap-3 rounded border border-solid px-2 py-1 transition-colors"
    :class="{
      'shadow-xl shadow-neutral-400 dark:shadow-neutral-800/60': isFloating
    }"
  >
    <div class="min-w-0 flex-1 truncate text-xs leading-5 text-gray-700 dark:text-gray-400">
      <span class="font-bold text-gray-900 dark:text-white">
        {{ t('PlayerTab.collectMode.collectedPageTitle') }}
      </span>
      <span class="ml-2">
        {{
          t('PlayerTab.collectMode.collectedPageDescription', {
            count: collectedGamesCount
          })
        }}
      </span>
    </div>

    <NButton
      class="shrink-0"
      size="tiny"
      secondary
      type="primary"
      :disabled="isCollectModeActionDisabled"
      @click="handleExitCollectMode"
    >
      {{ t('PlayerTab.collectMode.reloadNormalPage') }}
    </NButton>
  </div>

  <div
    v-else-if="horizontal"
    class="match-history-pagination flex items-center gap-2 rounded px-2 py-1 transition-colors"
    :class="{
      'rounded bg-neutral-300 shadow-xl shadow-neutral-400 dark:bg-neutral-800 dark:shadow-neutral-800/60':
        isFloating,
      'bg-black/5 dark:bg-white/5': !isFloating
    }"
  >
    <NSelect
      v-if="preferredSource === 'sgp' || isCrossRegion"
      :value="selectedQueue"
      @update:value="handleTagChange"
      size="small"
      :options="sgpTagOptions"
      :disabled="isPaginationDisabled"
      class="w-56!"
      :render-label="renderLabel"
      :consistent-menu-width="false"
    />

    <NTooltip>
      <template #trigger>
        <NButton
          size="small"
          :secondary="rootHasCombinator"
          :tertiary="!rootHasCombinator"
          circle
          :type="rootHasCombinator ? 'primary' : 'default'"
          :disabled="isPaginationDisabled"
          @click="handleOpenFilterModal"
        >
          <template #icon>
            <NIcon size="16"><Filter20Regular /></NIcon>
          </template>
        </NButton>
      </template>
      {{ t('PlayerTab.filter.title') }}
    </NTooltip>

    <NTooltip>
      <template #trigger>
        <NButton
          size="small"
          circle
          tertiary
          :type="rootHasCombinator ? 'warning' : 'default'"
          :disabled="!rootHasCombinator || isPaginationDisabled"
          @click="handleClearFilters"
        >
          <template #icon>
            <NIcon size="16"><Delete20Regular /></NIcon>
          </template>
        </NButton>
      </template>
      {{ t('PlayerTab.clearFilters') }}
    </NTooltip>

    <NModal v-model:show="showFilterModal">
      <div class="h-187.5 max-h-[90vh] min-h-[75vh] w-225 max-w-[90vw]">
        <MatchHistoryFilters
          v-model:active-mode="activeMode"
          v-model:simple-filter-state="simpleFilterState"
          v-model:advanced-filter-state="advancedFilterState"
          @collect-begin="handleCollectBegin"
        />
      </div>
    </NModal>
  </div>

  <div
    v-else-if="isCollectModePage"
    class="match-history-pagination border-akari-500/30 bg-akari-500/10 dark:border-akari-400/25 dark:bg-akari-400/10 rounded border border-solid px-4 py-3 transition-colors"
    :class="{
      'shadow-xl shadow-neutral-400 dark:shadow-neutral-800/60': isFloating
    }"
  >
    <div>
      <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
        {{ t('PlayerTab.collectMode.collectedPageTitle') }}
      </div>
      <div class="text-xs leading-relaxed text-gray-700 dark:text-gray-400">
        {{
          t('PlayerTab.collectMode.collectedPageDescription', {
            count: collectedGamesCount
          })
        }}
      </div>
    </div>

    <div class="mt-3 flex justify-end">
      <NButton
        size="small"
        secondary
        type="primary"
        :disabled="isCollectModeActionDisabled"
        @click="handleExitCollectMode"
      >
        {{ t('PlayerTab.collectMode.reloadNormalPage') }}
      </NButton>
    </div>
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
    <!-- sgp 情况下可用的特殊选项（秘传） -->
    <div class="space-y-2" v-if="preferredSource === 'sgp' || isCrossRegion">
      <TooltipWithIcon
        class="mb-2 text-xs text-black/60 dark:text-white/60"
        :tooltip="t('PlayerTab.sgpQueueOnlyTooltip')"
      >
        {{ t('PlayerTab.queue') }}
      </TooltipWithIcon>
      <NSelect
        :value="selectedQueue"
        @update:value="handleTagChange"
        size="small"
        :options="sgpTagOptions"
        :disabled="isPaginationDisabled"
        :render-label="renderLabel"
        :consistent-menu-width="false"
      />
    </div>

    <!-- 分页选项 -->
    <div class="space-y-2">
      <div class="text-xs text-black/60 dark:text-white/60">分页</div>
      <div class="flex items-center gap-1">
        <NSelect
          :disabled="isPaginationDisabled"
          :value="page?.queryParams.count ?? pts.frontendSettings.loadCount"
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
          @click="
            loadMatchHistory({
              startIndex:
                (computedCurrentPage - 2) *
                (page?.queryParams.count ?? pts.frontendSettings.loadCount)
            })
          "
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
          @click="
            loadMatchHistory({
              startIndex:
                computedCurrentPage * (page?.queryParams.count ?? pts.frontendSettings.loadCount)
            })
          "
          :disabled="isPaginationDisabled"
        >
          <template #icon>
            <NIcon size="16"><ChevronRight20Regular /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-xs text-black/60 dark:text-white/60">筛选</div>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              :secondary="rootHasCombinator"
              :tertiary="!rootHasCombinator"
              circle
              :type="rootHasCombinator ? 'primary' : 'default'"
              :disabled="isPaginationDisabled"
              @click="handleOpenFilterModal"
            >
              <template #icon>
                <NIcon size="16"><Filter20Regular /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('PlayerTab.filter.title') }}
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              circle
              tertiary
              :type="rootHasCombinator ? 'warning' : 'default'"
              :disabled="!rootHasCombinator || isPaginationDisabled"
              @click="handleClearFilters"
            >
              <template #icon>
                <NIcon size="16"><Delete20Regular /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('PlayerTab.clearFilters') }}
        </NTooltip>
      </div>
    </div>

    <NModal v-model:show="showFilterModal">
      <div class="h-187.5 max-h-[90vh] min-h-[75vh] w-225 max-w-[90vw]">
        <MatchHistoryFilters
          v-model:active-mode="activeMode"
          v-model:simple-filter-state="simpleFilterState"
          v-model:advanced-filter-state="advancedFilterState"
          @collect-begin="handleCollectBegin"
        />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Delete20Regular,
  Filter20Regular,
  Previous20Filled
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NInputNumber,
  NModal,
  NPopover,
  NSelect,
  NTooltip,
  SelectOption
} from 'naive-ui'
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
const { isLoading, loadMatchHistory, page, collectState } = useMatchHistory()
const { activeMode, simpleFilterState, advancedFilterState, rootHasCombinator, clearPredicate } =
  useMatchHistoryFilters()

const computedCurrentPage = computed(() => {
  if (!page.value) return 1

  const {
    queryParams: { startIndex = 0, count = pts.frontendSettings.loadCount }
  } = page.value

  return Math.floor(startIndex / count) + 1
})

const selectedQueue = computed(() => {
  if (!page.value) return ALL_SGPTAG_VALUE

  const {
    queryParams: { tag = ALL_SGPTAG_VALUE }
  } = page.value

  return tag
})

const isFirstPage = computed(() => computedCurrentPage.value <= 1)
const isCollectModePage = computed(() => page.value?.isLoadedByCollectMode ?? false)
const collectedGamesCount = computed(() => page.value?.games.length ?? 0)
const isCollectModeActionDisabled = computed(() => isLoading.value || !!collectState.value)
const isPaginationDisabled = computed(
  () => isLoading.value || !!collectState.value || isCollectModePage.value
)

const handleTagChange = (tag: string) => {
  if (isPaginationDisabled.value) {
    return
  }

  pts.frontendSettings.defaultMatchHistoryTag = tag
  loadMatchHistory({ tag: tag === ALL_SGPTAG_VALUE ? undefined : tag, startIndex: 0 })
}

const showFilterModal = ref(false)

const handleOpenFilterModal = () => {
  if (isPaginationDisabled.value) {
    return
  }

  showFilterModal.value = true
}

const handleClearFilters = () => {
  if (isPaginationDisabled.value) {
    return
  }

  showFilterModal.value = false
  clearPredicate()
}

const handleCollectBegin = () => {
  showFilterModal.value = false
}

const handleExitCollectMode = () => {
  if (isCollectModeActionDisabled.value) {
    return
  }

  loadMatchHistory()
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
    startIndex:
      (arbitraryPage.value - 1) * (page.value?.queryParams.count ?? pts.frontendSettings.loadCount)
  })
}

const handleGoToFirstPage = () => {
  if (isPaginationDisabled.value) {
    return
  }

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
</script>
