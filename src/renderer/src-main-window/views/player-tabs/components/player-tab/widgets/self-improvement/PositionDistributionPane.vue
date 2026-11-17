<template>
  <div v-if="entries.length" class="flex items-center gap-3">
    <div class="relative size-28 shrink-0">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div
        v-if="tooltip"
        class="pointer-events-none absolute z-20 rounded bg-neutral-900/95 px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-lg"
        :style="{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          transform: 'translate(-50%, -120%)'
        }"
      >
        {{ tooltip.text }}
      </div>
    </div>

    <div class="grid min-w-0 flex-1 grid-cols-1 gap-1">
      <div
        v-for="entry of entries"
        :key="entry.position"
        class="flex min-w-0 items-center gap-2 rounded bg-black/4 px-2 py-1 dark:bg-white/6"
      >
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: entry.color }" />
        <PositionIcon :position="entry.position" class="shrink-0 text-sm" />
        <span class="truncate text-xs text-gray-700 dark:text-gray-300">{{ entry.label }}</span>
        <span
          class="ml-auto shrink-0 text-xs font-semibold whitespace-nowrap text-gray-900 tabular-nums dark:text-white"
        >
          {{ entry.count }} 场
        </span>
        <span
          class="w-20 shrink-0 text-right text-xs whitespace-nowrap text-gray-500 tabular-nums dark:text-gray-400"
        >
          {{ entry.winRate.toFixed(0) }}% 胜率
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { ArcElement, Chart as ChartJS, type ChartData, type ChartOptions, Tooltip } from 'chart.js'
import { useTranslation } from 'i18next-vue'
import { computed, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'

import { usePlayerTab } from '../../context'
import { useMatchHistory } from '../../data/match-history'

ChartJS.register(ArcElement, Tooltip)

const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

const POSITION_COLORS = {
  TOP: '#e06b6b',
  JUNGLE: '#55a879',
  MIDDLE: '#d7a84d',
  BOTTOM: '#5d8ed6',
  UTILITY: '#9b79c6'
} as const

const { t } = useTranslation()
const { t: tCommon } = useTranslation('common')
const { filteredGames } = useMatchHistory()
const { puuid } = usePlayerTab()

const entries = computed(() => {
  const stats = new Map<string, { count: number; wins: number }>()

  for (const game of filteredGames.value) {
    const basic = toBasicInfo(game)
    const participant = toParticipants(game, basic).find((item) => item.puuid === puuid.value)
    const position = participant?.position

    if (!position || !POSITIONS.includes(position as (typeof POSITIONS)[number])) {
      continue
    }

    const current = stats.get(position) ?? { count: 0, wins: 0 }
    current.count += 1
    current.wins += participant.win ? 1 : 0
    stats.set(position, current)
  }

  return POSITIONS.filter((position) => stats.has(position)).map((position) => {
    const { count, wins } = stats.get(position)!
    return {
      position,
      count,
      wins,
      winRate: count > 0 ? (wins / count) * 100 : 0,
      label: tCommon(`positions.${position}`),
      color: POSITION_COLORS[position]
    }
  })
})

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

const tooltip = ref<{ x: number; y: number; text: string } | null>(null)

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  cutout: '58%',
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: (context) => {
        const model = context.tooltip

        if (!model.opacity) {
          tooltip.value = null
          return
        }

        const entry = entries.value[model.dataPoints?.[0]?.dataIndex ?? -1]
        if (!entry) {
          tooltip.value = null
          return
        }

        tooltip.value = {
          x: model.caretX,
          y: model.caretY,
          text: `${entry.label}: ${t('selfImprovement.positionDistribution.tooltip', {
            count: entry.count,
            rate: entry.winRate.toFixed(0)
          })}`
        }
      }
    }
  }
}
</script>
