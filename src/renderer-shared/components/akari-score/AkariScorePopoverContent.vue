<template>
  <div class="w-64 text-xs text-gray-700 dark:text-gray-300">
    <div class="flex items-center justify-between gap-4">
      <span class="font-semibold text-gray-900 dark:text-white">
        {{ t('akariScore.title') }}
      </span>
      <span class="font-semibold text-gray-900 tabular-nums dark:text-white">
        {{ formatValue(score.total, totalPrecision) }}
      </span>
    </div>

    <div class="mt-2 flex flex-col gap-2">
      <div v-for="item in items" :key="item.key" class="flex flex-col gap-1">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
          <span class="truncate text-gray-600 dark:text-gray-400">
            {{ t(item.labelKey) }}
          </span>
          <span class="text-right text-gray-900 tabular-nums dark:text-white">
            {{ formatValue(item.value) }}
            <span class="px-1 text-gray-400 dark:text-gray-500">/</span>
            <span>{{ formatMax(item.max) }}</span>
          </span>
        </div>
        <NProgress
          :height="5"
          :percentage="item.progressPercentage"
          :show-indicator="false"
          :status="item.progressStatus"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { useTranslation } from 'i18next-vue'
import { NProgress } from 'naive-ui'
import { computed } from 'vue'

import { getAkariScoreBreakdownItems } from './score-breakdown'

const props = withDefaults(
  defineProps<{
    score: AkariScore
    totalPrecision?: number
  }>(),
  {
    totalPrecision: 2
  }
)

const { t } = useTranslation()

const items = computed(() => getAkariScoreBreakdownItems(props.score))

const formatValue = (value: number, precision = 2) => {
  if (!Number.isFinite(value)) {
    return t('akariScore.na')
  }

  return value.toFixed(precision)
}

const formatMax = (value: number | null) => {
  if (value === null) {
    return t('akariScore.noFixedCap')
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}
</script>
