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

    <NSelect
      :disabled="isLoading"
      :value="selectedModeValue"
      @update:value="handleModeChange"
      size="small"
      :options="mutuallyExclusiveOptions"
      class="w-40!"
    />

    <NRadioGroup size="small" :value="filterMode" @update:value="handleFilterModeChange">
      <NRadioButton value="simple">{{ t('PlayerTab.filter.simpleTab') }}</NRadioButton>
      <NRadioButton value="advanced">{{ t('PlayerTab.filter.advancedTab') }}</NRadioButton>
    </NRadioGroup>

    <NPopover
      v-if="isSimpleMode"
      v-model:show="showSimpleFilterPopover"
      display-directive="show"
      trigger="click"
      placement="bottom"
      :theme-overrides="{ padding: '0px' }"
    >
      <template #trigger>
        <NButton
          size="small"
          :secondary="hasActiveFilters"
          :tertiary="!hasActiveFilters"
          circle
          v-bind:[FTUE_TARGET_ATTR]="FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON"
          :type="hasActiveFilters ? 'primary' : 'default'"
          :title="t('PlayerTab.filter.title')"
        >
          <template #icon>
            <NIcon size="16"><Filter20Regular /></NIcon>
          </template>
        </NButton>
      </template>
      <MatchHistoryFilter class="w-[300px]" />
    </NPopover>

    <NButton
      v-else
      size="small"
      :secondary="hasActiveFilters"
      :tertiary="!hasActiveFilters"
      circle
      :type="hasActiveFilters ? 'primary' : 'default'"
      :title="t('PlayerTab.filter.title')"
      @click="handleOpenAdvancedFilterModal"
    >
      <template #icon>
        <NIcon size="16"><Filter20Regular /></NIcon>
      </template>
    </NButton>

    <div v-if="!isTimeRangeMode" class="flex items-center gap-1">
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

    <NModal v-model:show="showAdvancedFilterModal">
      <div class="h-[750px] max-h-[90vh] min-h-[75vh] w-[900px] max-w-[90vw]">
        <MatchHistoryFilters />
      </div>
    </NModal>
  </div>

  <div
    v-else
    class="match-history-pagination space-y-2 rounded px-4 py-3 transition-colors"
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
      :disabled="isLoading"
      :render-label="renderLabel"
      :consistent-menu-width="false"
    />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <NSelect
        class="w-34!"
        :disabled="isLoading"
        :value="selectedModeValue"
        @update:value="handleModeChange"
        size="small"
        :options="mutuallyExclusiveOptions"
      />

      <NRadioGroup size="small" :value="filterMode" @update:value="handleFilterModeChange">
        <NRadioButton value="simple">{{ t('PlayerTab.filter.simpleTab') }}</NRadioButton>
        <NRadioButton value="advanced">{{ t('PlayerTab.filter.advancedTab') }}</NRadioButton>
      </NRadioGroup>

      <NPopover
        v-if="isSimpleMode"
        v-model:show="showSimpleFilterPopover"
        display-directive="show"
        trigger="click"
        placement="bottom"
        :theme-overrides="{ padding: '0px' }"
      >
        <template #trigger>
          <NButton
            size="small"
            :secondary="hasActiveFilters"
            :tertiary="!hasActiveFilters"
            circle
            v-bind:[FTUE_TARGET_ATTR]="FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON"
            :type="hasActiveFilters ? 'primary' : 'default'"
            :title="t('PlayerTab.filter.title')"
          >
            <template #icon>
              <NIcon size="16"><Filter20Regular /></NIcon>
            </template>
          </NButton>
        </template>
        <MatchHistoryFilter class="w-[300px]" />
      </NPopover>

      <NButton
        v-else
        size="small"
        :secondary="hasActiveFilters"
        :tertiary="!hasActiveFilters"
        circle
        :type="hasActiveFilters ? 'primary' : 'default'"
        :title="t('PlayerTab.filter.title')"
        @click="handleOpenAdvancedFilterModal"
      >
        <template #icon>
          <NIcon size="16"><Filter20Regular /></NIcon>
        </template>
      </NButton>

      <div v-if="!isTimeRangeMode" class="flex items-center gap-1">
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

    <NModal v-model:show="showAdvancedFilterModal">
      <div class="h-[750px] max-h-[90vh] min-h-[75vh] w-[900px] max-w-[90vw]">
        <MatchHistoryFilters />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import { FTUE_TARGET_ATTR, FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON } from '@shared/constants/ftue'
import {
  ArrowCircleRight32Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
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
  NRadioButton,
  NRadioGroup,
  NSelect,
  SelectOption
} from 'naive-ui'
import { computed, h, ref, watch, watchEffect } from 'vue'

import { useMapAssets } from '@main-window/composables/useMapAssets'
import {
  type MatchHistoryTimeRange,
  usePageSizeOptions
} from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'
import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import MatchHistoryFilter from './MatchHistoryFilter.vue'
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
const { mode, hasActiveFilters, setMode } = useMatchHistoryFilters()

const isSimpleMode = computed(() => mode.value === 'simple')
const filterMode = computed(() => mode.value)

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

const selectedTimeRange = computed<MatchHistoryTimeRange>(() => {
  return pagedMatchHistory.value?.queryParams.timeRange ?? pts.frontendSettings.defaultMatchHistoryTimeRange
})

const isTimeRangeMode = computed(() => selectedTimeRange.value !== 'all')

const selectedModeValue = computed(() => {
  if (isTimeRangeMode.value) {
    return `time:${selectedTimeRange.value}`
  }

  const count = pagedMatchHistory.value?.queryParams.count ?? pts.frontendSettings.loadCount
  return `count:${count}`
})

const mutuallyExclusiveOptions = computed<SelectOption[]>(() => [
  {
    type: 'group',
    label: t('PlayerTab.byCount'),
    key: 'by-count',
    children: pageSizeOptions.value.map((o) => ({
      label: o.label,
      value: `count:${o.value}`
    }))
  },
  {
    type: 'group',
    label: t('PlayerTab.byTime'),
    key: 'by-time',
    children: [
      {
        label: t('PlayerTab.timeRange.last24Hours'),
        value: 'time:24h'
      },
      {
        label: t('PlayerTab.timeRange.last3Days'),
        value: 'time:3d'
      },
      {
        label: t('PlayerTab.timeRange.last7Days'),
        value: 'time:7d'
      },
      {
        label: t('PlayerTab.timeRange.last30Days'),
        value: 'time:30d'
      }
    ]
  }
])

const isFirstPage = computed(() => computedCurrentPage.value <= 1)

const handleTagChange = (tag: string) => {
  pts.frontendSettings.defaultMatchHistoryTag = tag
  loadMatchHistory({ tag: tag === ALL_SGPTAG_VALUE ? undefined : tag, startIndex: 0 })
}

const handleModeChange = (value: string | number | null) => {
  if (!value || typeof value !== 'string') {
    return
  }

  if (value.startsWith('count:')) {
    const count = Number(value.slice('count:'.length))

    if (!Number.isFinite(count) || count <= 0) {
      return
    }

    pts.frontendSettings.defaultMatchHistoryTimeRange = 'all'
    loadMatchHistory({ count, timeRange: 'all', startIndex: 0 })
    return
  }

  if (value.startsWith('time:')) {
    const timeRange = value.slice('time:'.length) as MatchHistoryTimeRange

    if (timeRange === 'all') {
      return
    }

    pts.frontendSettings.defaultMatchHistoryTimeRange = timeRange
    loadMatchHistory({ timeRange, startIndex: 0 })
  }
}

const showSimpleFilterPopover = ref(false)
const showAdvancedFilterModal = ref(false)

const handleFilterModeChange = (value: 'simple' | 'advanced') => {
  showSimpleFilterPopover.value = false
  showAdvancedFilterModal.value = false
  setMode(value)
}

const handleOpenAdvancedFilterModal = () => {
  showAdvancedFilterModal.value = true
}

watch(
  () => mode.value,
  () => {
    showSimpleFilterPopover.value = false
    showAdvancedFilterModal.value = false
  }
)

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
</script>
