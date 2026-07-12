<template>
  <div class="flex min-h-48 items-center justify-center gap-8">
    <div class="size-48 shrink-0">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div class="grid min-w-52 gap-1.5">
      <div
        v-for="entry of entries"
        :key="entry.position"
        class="grid grid-cols-[1rem_minmax(0,1fr)_max-content] items-center gap-2 rounded bg-black/4 px-2 py-1.5 dark:bg-white/6"
      >
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
        <span class="inline-flex items-center gap-1.5">
          <PositionIcon :position="entry.position" class="text-sm" />
          {{ entry.label }}
        </span>
        <span class="font-semibold text-black/85 tabular-nums dark:text-white/85">
          {{ entry.count }} · {{ formatPercent(entry.count / total) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import type { AggregatedPositionAnalysis } from '@shared/data-adapter/analysis/player/aggregate/positions'
import { ArcElement, Chart as ChartJS, type ChartData, type ChartOptions, Tooltip } from 'chart.js'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip)

const { positions } = defineProps<{
  positions: AggregatedPositionAnalysis
}>()

const { t } = useTranslation('common')

const POSITION_COLORS = {
  TOP: '#e06b6b',
  JUNGLE: '#55a879',
  MIDDLE: '#d7a84d',
  BOTTOM: '#5d8ed6',
  UTILITY: '#9b79c6'
} as const

const entries = computed(() =>
  Object.entries(positions)
    .filter(([, count]) => count > 0)
    .toSorted((a, b) => b[1] - a[1])
    .map(([position, count]) => ({
      position: position as keyof typeof POSITION_COLORS,
      count,
      label: t(`positions.${position}`),
      color: POSITION_COLORS[position as keyof typeof POSITION_COLORS]
    }))
)

const total = computed(() => entries.value.reduce((sum, entry) => sum + entry.count, 0))
const formatPercent = (value: number) => `${(value * 100).toFixed()}%`

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: entries.value.map((entry) => entry.label),
  datasets: [
    {
      data: entries.value.map((entry) => entry.count),
      backgroundColor: entries.value.map((entry) => entry.color),
      borderWidth: 0,
      hoverOffset: 4
    }
  ]
}))

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  cutout: '58%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) =>
          `${context.label}: ${context.parsed} · ${formatPercent(context.parsed / total.value)}`
      }
    }
  }
}
</script>
