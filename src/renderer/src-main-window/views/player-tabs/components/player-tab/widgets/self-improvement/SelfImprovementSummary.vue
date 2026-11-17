<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="text-base font-bold text-gray-900 dark:text-white">
        {{ t('selfImprovement.summary.title') }}
      </div>
      <div>
        <NButton size="tiny" secondary :focusable="false" @click="showModal = true">
          {{ t('selfImprovement.summary.open') }}
        </NButton>
      </div>
    </div>

    <div v-if="deltas.length" class="flex flex-col gap-1">
      <div v-for="entry of deltas" :key="entry.key" class="flex w-full items-center gap-2 text-xs">
        <span class="text-gray-700 dark:text-gray-400">{{ entry.label }}</span>
        <span
          class="ml-auto text-[13px] tabular-nums"
          :class="
            entry.positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          "
        >
          {{ entry.text }}
        </span>
      </div>
      <div class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {{
          t('selfImprovement.summary.basis', {
            recent: recentCount,
            previous: previousCount
          })
        }}
      </div>
    </div>
    <div v-else class="text-xs text-gray-500 dark:text-gray-400">
      {{ t('selfImprovement.summary.notEnough') }}
    </div>

    <SelfImprovementModal v-model:show="showModal" :matches="matches" />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed, ref } from 'vue'

import { useMatchHistory } from '../../data/match-history'
import { usePlayerTab } from '../../context'
import { extractSelfImprovementMatch } from './data/self-improvement-metrics'
import { useSelfImprovementAnalysis } from './composables/useSelfImprovementAnalysis'
import SelfImprovementModal from './SelfImprovementModal.vue'

const { t } = useTranslation()
const { filteredGames } = useMatchHistory()
const { puuid } = usePlayerTab()

const showModal = ref(false)

const matches = computed(() =>
  filteredGames.value
    .map((game) => extractSelfImprovementMatch(game, puuid.value))
    .filter((match) => match !== null)
)

const { windowComparison } = useSelfImprovementAnalysis(matches)

const recentCount = computed(() => windowComparison.value.recent.count)
const previousCount = computed(() => windowComparison.value.previous.count)

const formatDelta = (value: number, digits: number) => {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(digits)}`
}

const deltas = computed(() => {
  if (previousCount.value === 0) {
    return []
  }

  const { delta } = windowComparison.value

  return [
    {
      key: 'csPerMinute',
      label: t('selfImprovement.summary.csPerMinute'),
      text: formatDelta(delta.csPerMinute ?? 0, 1),
      positive: (delta.csPerMinute ?? 0) >= 0
    },
    {
      key: 'goldPerMinute',
      label: t('selfImprovement.summary.goldPerMinute'),
      text: formatDelta(delta.goldPerMinute ?? 0, 0),
      positive: (delta.goldPerMinute ?? 0) >= 0
    },
    {
      key: 'kda',
      label: t('selfImprovement.summary.kda'),
      text: formatDelta(delta.kda ?? 0, 2),
      positive: (delta.kda ?? 0) >= 0
    },
    {
      key: 'visionScorePerMinute',
      label: t('selfImprovement.summary.visionScorePerMinute'),
      text: formatDelta(delta.visionScorePerMinute ?? 0, 1),
      positive: (delta.visionScorePerMinute ?? 0) >= 0
    }
  ]
})
</script>
