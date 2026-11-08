<template>
  <section
    class="grid grid-cols-1 gap-3"
    :class="columns === 3 ? 'lg:grid-cols-3' : 'xl:grid-cols-2'"
  >
    <SelfImprovementTrendChart
      v-for="chart in charts"
      :key="chart.key"
      :title="chart.title"
      :unit="chart.unit"
      :color="chart.color"
      :points="chart.points"
      :moving-average="chart.movingAverage"
      :moving-average-window="movingAverageWindow"
      :precision="chart.precision"
      :percent="chart.percent"
      :average="chart.average"
      :aria-label="chart.ariaLabel"
    />
  </section>
</template>

<script setup lang="ts">
import type { SelfImprovementChartView } from './types'
import SelfImprovementTrendChart from './SelfImprovementTrendChart.vue'

withDefaults(
  defineProps<{
    charts: SelfImprovementChartView[]
    movingAverageWindow?: number
    columns?: 2 | 3
  }>(),
  {
    movingAverageWindow: 10,
    columns: 2
  }
)
</script>
