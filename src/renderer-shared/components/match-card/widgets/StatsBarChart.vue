<template>
  <div class="w-120">
    <div v-if="title" class="text-center text-sm font-bold">{{ title }}</div>
    <div class="w-120" :style="{ height: `${height}px` }">
      <Bar :data="data" :options="options" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { MatchParticipant } from '@shared/data-adapter/match-history/participants'
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

import { useMatchCard } from '../context'
import { getTeamColor } from '../utils/theme'

const lcs = useLeagueClientStore()

const { title = '', chartData = [] } = defineProps<{
  title?: string

  chartData?: {
    participantId: number
    value: number
  }[]
}>()

const { participants, theme, hidePrivacy } = useMatchCard()

const height = computed(() => {
  return chartData.length * 28
})

const participantMap = computed(() => {
  return participants.value.reduce(
    (acc, p) => {
      acc[p.participantId] = p
      return acc
    },
    {} as Record<number, MatchParticipant>
  )
})

const sortedData = computed(() => {
  return chartData.toSorted((a, b) => {
    const aParticipant = participantMap.value[a.participantId]
    const bParticipant = participantMap.value[b.participantId]

    if (aParticipant.teamIdentifier !== bParticipant.teamIdentifier) {
      return aParticipant.teamIdentifier.localeCompare(bParticipant.teamIdentifier)
    }

    return b.value - a.value
  })
})

const data = computed<ChartData<'bar'>>(() => {
  return {
    labels: sortedData.value.map(
      (p) => `${lcs.gameData.championName(participantMap.value[p.participantId].championId)}`
    ),
    datasets: [
      {
        data: sortedData.value.map((p) => p.value),
        backgroundColor: sortedData.value.map((p) =>
          getTeamColor(participantMap.value[p.participantId].teamIdentifier)
        )
      }
    ]
  }
})

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  devicePixelRatio: Math.max(window.devicePixelRatio, 2),
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (item) => {
          const d = sortedData.value[item.dataIndex]
          const p = participantMap.value[d.participantId]
          const name = hidePrivacy.value
            ? lcs.gameData.championName(p.championId)
            : `${p.gameName}#${p.tagLine}`
          return `${name}: ${d.value}`
        }
      }
    },
    datalabels: {
      display: 'auto',
      color: () => {
        if (theme.value === 'dark') {
          return '#fff'
        }

        return '#000'
      },
      clamp: true,
      anchor: 'end',
      align: 'end',
      font: {
        weight: 'bold'
      },
      formatter: (value) =>
        typeof value === 'number'
          ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : value
    }
  },
  scales: {
    x: {
      grace: '15%'
    }
  }
}))
</script>
