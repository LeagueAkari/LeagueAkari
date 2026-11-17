<template>
  <div
    class="flex flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
    role="img"
    :aria-label="ariaLabel"
  >
    <div class="flex items-baseline justify-between gap-2">
      <div class="flex items-baseline gap-2">
        <span class="text-sm font-bold text-black/85 dark:text-white/85">{{ title }}</span>
        <span v-if="unit" class="text-[11px] text-black/45 dark:text-white/45">{{ unit }}</span>
      </div>
      <div v-if="points.length" class="flex items-baseline gap-1">
        <span class="text-[11px] text-black/45 dark:text-white/45">
          {{ t('selfImprovement.charts.average') }}
        </span>
        <span class="text-sm font-bold text-black/80 tabular-nums dark:text-white/80">
          {{ formatValue(averageValue) }}
        </span>
      </div>
    </div>

    <div v-if="points.length" class="h-52">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div
      v-else
      class="flex h-52 items-center justify-center text-xs text-black/40 dark:text-white/40"
    >
      {{ t('selfImprovement.charts.empty') }}
    </div>

    <div class="text-[11px] text-black/40 dark:text-white/40">
      {{ t('selfImprovement.charts.winLossHint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'

import type { SelfImprovementChartPoint } from './types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const props = defineProps<{
  title: string
  unit: string
  color: string
  points: SelfImprovementChartPoint[]
  movingAverage?: (number | null)[]
  movingAverageWindow?: number
  precision?: number
  percent?: boolean
  /** 与 KPI、长期趋势表一致的加权均值；未提供时退回逐场算术平均 */
  average?: number
  ariaLabel?: string
}>()

const resources = useAkariResourceProvider()
const { t } = useTranslation()

const isDark = computed(() => resources.runtime.colorMode === 'dark')

const precision = computed(() => props.precision ?? 1)

const averageValue = computed(() => {
  if (props.average !== undefined) {
    return props.average
  }

  if (props.points.length === 0) {
    return 0
  }

  return props.points.reduce((acc, point) => acc + point.value, 0) / props.points.length
})

const formatValue = (value: number) => {
  if (props.percent) {
    return `${(value * 100).toFixed(precision.value)}%`
  }

  const fixed = value.toFixed(precision.value)
  return props.unit ? `${fixed} ${props.unit}` : fixed
}

const tickColor = computed(() => (isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'))
const gridColor = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
)
const mutedColor = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'
)

const hasMovingAverage = computed(
  () => (props.movingAverage?.filter((value) => value !== null).length ?? 0) >= 2
)

const chartData = computed(() => {
  const datasets: any[] = [
    {
      label: props.title,
      data: props.points.map((point) => point.value),
      borderColor: props.color,
      backgroundColor: props.color,
      borderWidth: 2,
      tension: 0.25,
      pointRadius: 2.5,
      pointHoverRadius: 5,
      pointBackgroundColor: props.points.map((point) =>
        point.win ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
      ),
      pointBorderColor: props.points.map((point) =>
        point.win ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
      )
    }
  ]

  if (hasMovingAverage.value) {
    datasets.push({
      label: t('selfImprovement.charts.movingAverage', {
        count: props.movingAverageWindow ?? 10
      }),
      data: props.movingAverage,
      borderColor: mutedColor.value,
      borderDash: [6, 4],
      borderWidth: 1.5,
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 0,
      spanGaps: true
    })
  }

  return {
    labels: props.points.map((point) => point.label),
    datasets
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      datalabels: {
        display: false
      },
      legend: {
        display: hasMovingAverage.value,
        position: 'bottom' as const,
        labels: {
          boxWidth: 18,
          boxHeight: 8,
          usePointStyle: false,
          color: tickColor.value
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (items: any[]) => {
            const point = props.points[items[0]?.dataIndex ?? 0]
            if (!point) {
              return ''
            }

            return `${point.dateText} · ${point.championName}`
          },
          label: (context: any) => {
            if (context.parsed.y === null || context.parsed.y === undefined) {
              return ''
            }

            if (context.datasetIndex !== 0) {
              return `${context.dataset.label}: ${formatValue(context.parsed.y)}`
            }

            return `${props.title}: ${formatValue(context.parsed.y)}`
          },
          afterBody: (items: any[]) => {
            const point = props.points[items[0]?.dataIndex ?? 0]
            if (!point) {
              return ''
            }

            return [
              `${t('selfImprovement.charts.kdaLabel')}: ${point.kdaText}`,
              `${point.resultText} · ${point.durationText}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: gridColor.value
        },
        ticks: {
          color: tickColor.value,
          maxTicksLimit: 8,
          maxRotation: 0,
          autoSkip: true
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor.value
        },
        ticks: {
          color: tickColor.value,
          callback: (value: any) => {
            if (props.percent) {
              return `${(Number(value) * 100).toFixed(0)}%`
            }

            return Number(value).toLocaleString(undefined, {
              maximumFractionDigits: precision.value
            })
          }
        }
      }
    }
  }
})
</script>
