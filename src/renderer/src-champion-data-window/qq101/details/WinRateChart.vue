<template>
  <div v-if="hasData" class="p-3">
    <div class="h-52">
      <Chart
        :type="chart.kind"
        :data="data"
        :options="options"
        :aria-label="t(`qq101.details.${chart.kind === 'line' ? 'trend' : 'durations'}`)"
      />
    </div>
  </div>
  <SectionPlaceholder v-else :description="t('qq101.empty')" />
</template>

<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import { useTranslation } from 'i18next-vue'
import { useThemeVars } from 'naive-ui'
import { computed } from 'vue'
import { Chart } from 'vue-chartjs'

import SectionPlaceholder from './SectionPlaceholder.vue'
import type { DetailChart } from './presentation'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  BarController,
  LineElement,
  PointElement,
  BarElement,
  Tooltip
)

const { chart } = defineProps<{ chart: DetailChart }>()
const { t } = useTranslation()
const theme = useThemeVars()

const hasData = computed(() => chart.points.some((point) => point.winRate !== null))

const data = computed<ChartData<'line' | 'bar'>>(() => ({
  labels: chart.points.map((point) => point.label),
  datasets: [
    {
      label: t('qq101.details.winRate'),
      data: chart.points.map((point) => (point.winRate === null ? null : point.winRate * 100)),
      borderColor: theme.value.primaryColor,
      backgroundColor: theme.value.primaryColor,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      maxBarThickness: 36,
      borderRadius: 2,
      tension: 0,
      spanGaps: false
    }
  ]
}))

const options = computed<ChartOptions<'line' | 'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  color: theme.value.textColor2,
  font: { family: theme.value.fontFamily, size: 11 },
  interaction: { mode: 'index', axis: 'x', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      backgroundColor: theme.value.popoverColor,
      titleColor: theme.value.textColor1,
      bodyColor: theme.value.textColor2,
      borderColor: theme.value.borderColor,
      borderWidth: 1,
      callbacks: {
        label: (context) => `${t('qq101.details.winRate')}: ${context.parsed.y?.toFixed(2)}%`,
        afterLabel: (context) => {
          const rank = chart.points[context.dataIndex].rank
          return rank == null ? '' : `${t('qq101.details.rank')}: ${rank}`
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: t(`qq101.details.${chart.axis}`),
        color: theme.value.textColor3
      },
      ticks: { color: theme.value.textColor3, maxRotation: 0, maxTicksLimit: 8 },
      grid: { display: false },
      border: { color: theme.value.borderColor }
    },
    y: {
      title: {
        display: true,
        text: t('qq101.details.winRate'),
        color: theme.value.textColor3
      },
      min: chart.kind === 'bar' ? 0 : undefined,
      max: chart.kind === 'bar' ? 100 : undefined,
      grace: '10%',
      ticks: {
        color: theme.value.textColor3,
        maxTicksLimit: 6,
        stepSize: chart.kind === 'bar' ? 25 : undefined,
        callback: (value) => `${value}%`
      },
      grid: { color: theme.value.borderColor },
      border: { display: false }
    }
  }
}))
</script>
