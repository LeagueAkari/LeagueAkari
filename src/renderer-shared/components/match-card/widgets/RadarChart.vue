<template>
  <div class="h-80 w-80">
    <Radar :data="data" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { noZero } from '@shared/data-adapter/utils'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'

import { useMatchCard } from '../context'

const { puuid } = defineProps<{
  puuid?: string
}>()

const { teams, participants, theme, hidePrivacy } = useMatchCard()
const { t } = useTranslation()

const lcs = useLeagueClientStore()

// 可被替换
const isDark = computed(() => theme.value === 'dark')

const chartColors = computed(() => {
  if (isDark.value) {
    return {
      player: {
        background: 'rgba(248,113,113,0.18)',
        border: 'rgba(252,165,165,0.95)',
        point: '#f87171'
      },
      team: {
        background: 'rgba(148,163,184,0.18)',
        border: 'rgba(203,213,225,0.9)',
        point: '#cbd5f1'
      },
      legend: '#e2e8f0',
      label: '#e2e8f0',
      grid: 'rgba(226,232,240,0.16)',
      angle: 'rgba(226,232,240,0.18)',
      tooltipBg: 'rgba(15,23,42,0.92)',
      tooltipBorder: 'rgba(148,163,184,0.4)',
      tooltipTitle: '#f8fafc',
      tooltipBody: '#e2e8f0'
    }
  }

  return {
    player: {
      background: 'rgba(255,99,132,0.16)',
      border: 'rgba(220,38,38,0.9)',
      point: '#ef4444'
    },
    team: {
      background: 'rgba(148,163,184,0.18)',
      border: 'rgba(71,85,105,0.9)',
      point: '#475569'
    },
    legend: '#1f2937',
    label: '#111827',
    grid: 'rgba(15,23,42,0.08)',
    angle: 'rgba(15,23,42,0.12)',
    tooltipBg: 'rgba(255,255,255,0.94)',
    tooltipBorder: 'rgba(148,163,184,0.5)',
    tooltipTitle: '#111827',
    tooltipBody: '#1f2937'
  }
})

const participant = computed(() => {
  return participants.value.find((p) => p.puuid === puuid)
})

const selfName = computed(() => {
  if (!participant.value) return null

  if (hidePrivacy.value) return lcs.gameData.championName(participant.value.championId)

  return `${participant.value.gameName} #${participant.value.tagLine}`
})

const team = computed(() => {
  if (!participant.value) return null
  return teams.value.teamStatMap[participant.value.teamIdentifier]
})

const teamSize = computed(() => {
  if (!team.value) return 0
  return participants.value.filter((p) => p.teamIdentifier === team.value!.teamIdentifier).length
})

const percentage = computed(() => {
  if (!participant.value || !team.value) {
    return {
      damageDealtToChampions: 0,
      damageTaken: 0,
      goldEarned: 0,
      cs: 0,
      kda: 0,
      killParticipation: 0,
      totalHeal: 0,

      damageDealtToChampionsRatioToMax: 0,
      damageTakenRatioToMax: 0,
      goldEarnedRatioToMax: 0,
      csRatioToMax: 0,
      kdaRatioToMax: 0,
      killParticipationRatioToMax: 0,
      totalHealRatioToMax: 0,

      teamAvgDamageDealtToChampionsRatioToMax: 0,
      teamAvgDamageTakenRatioToMax: 0,
      teamAvgGoldEarnedRatioToMax: 0,
      teamAvgCsRatioToMax: 0,
      teamAvgKdaRatioToMax: 0,
      teamAvgKillParticipationRatioToMax: 0,
      teamAvgTotalHealRatioToMax: 0
    }
  }

  const damageDealtToChampionsRatioToMax =
    participant.value.totalDamageDealtToChampions /
    noZero(teams.value.allTeamStats.maxDamageDealtToChampions)
  const damageTakenRatioToMax =
    participant.value.totalDamageTaken / noZero(teams.value.allTeamStats.maxDamageTaken)
  const goldEarnedRatioToMax =
    participant.value.goldEarned / noZero(teams.value.allTeamStats.maxGoldEarned)
  const csRatioToMax = participant.value.cs / noZero(teams.value.allTeamStats.maxCs)
  const kdaRatioToMax = participant.value.kda / noZero(teams.value.allTeamStats.maxKda)
  const killParticipationRatioToMax =
    participant.value.killParticipation / noZero(teams.value.allTeamStats.maxKillParticipation)
  const totalHealRatioToMax = participant.value.totalHeal / noZero(teams.value.allTeamStats.maxHeal)

  const teamAvgDamageDealtToChampionsRatioToMax =
    team.value.totalDamageDealtToChampions /
    teamSize.value /
    noZero(teams.value.allTeamStats.maxDamageDealtToChampions)
  const teamAvgDamageTakenRatioToMax =
    team.value.totalDamageTaken / teamSize.value / noZero(teams.value.allTeamStats.maxDamageTaken)
  const teamAvgGoldEarnedRatioToMax =
    team.value.totalGoldEarned / teamSize.value / noZero(teams.value.allTeamStats.maxGoldEarned)
  const teamAvgCsRatioToMax = team.value.totalCs / teamSize.value / teams.value.allTeamStats.maxCs
  const teamAvgKdaRatioToMax =
    team.value.totalKda / teamSize.value / noZero(teams.value.allTeamStats.maxKda)
  const teamAvgKillParticipationRatioToMax =
    team.value.totalKillParticipation /
    teamSize.value /
    noZero(teams.value.allTeamStats.maxKillParticipation)
  const teamAvgTotalHealRatioToMax =
    team.value.totalHeal / teamSize.value / noZero(teams.value.allTeamStats.maxHeal)

  return {
    damageDealtToChampions: participant.value.totalDamageDealtToChampions,
    damageTaken: participant.value.totalDamageTaken,
    goldEarned: participant.value.goldEarned,
    cs: participant.value.cs,
    kda: participant.value.kda,
    killParticipation: participant.value.killParticipation,
    totalHeal: participant.value.totalHeal,

    damageDealtToChampionsRatioToMax,
    damageTakenRatioToMax,
    goldEarnedRatioToMax,
    csRatioToMax,
    kdaRatioToMax,
    killParticipationRatioToMax,
    totalHealRatioToMax,

    teamAvgDamageDealtToChampionsRatioToMax,
    teamAvgDamageTakenRatioToMax,
    teamAvgGoldEarnedRatioToMax,
    teamAvgCsRatioToMax,
    teamAvgKdaRatioToMax,
    teamAvgKillParticipationRatioToMax,
    teamAvgTotalHealRatioToMax
  }
})

const data = computed<ChartData<'radar'>>(() => {
  return {
    labels: [
      t('matchCard.radar.damage', {
        value: percentage.value.damageDealtToChampions.toLocaleString()
      }),
      t('matchCard.radar.taken', { value: percentage.value.damageTaken.toLocaleString() }),
      t('matchCard.radar.gold', { value: percentage.value.goldEarned.toLocaleString() }),
      t('matchCard.radar.cs', { value: percentage.value.cs.toLocaleString() }),
      t('matchCard.radar.kda', { value: percentage.value.kda.toFixed(2) }),
      t('matchCard.radar.kp', { value: (percentage.value.killParticipation * 100).toFixed(0) }),
      t('matchCard.radar.heal', { value: percentage.value.totalHeal.toLocaleString() })
    ],
    datasets: [
      {
        label: selfName.value ?? puuid,
        backgroundColor: chartColors.value.player.background,
        borderColor: chartColors.value.player.border,
        borderWidth: 2,
        pointBackgroundColor: chartColors.value.player.point,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: chartColors.value.player.border,
        data: [
          percentage.value.damageDealtToChampionsRatioToMax,
          percentage.value.damageTakenRatioToMax,
          percentage.value.goldEarnedRatioToMax,
          percentage.value.csRatioToMax,
          percentage.value.kdaRatioToMax,
          percentage.value.killParticipationRatioToMax,
          percentage.value.totalHealRatioToMax
        ]
      },
      {
        label: t('matchCard.radar.teamAvg'),
        backgroundColor: chartColors.value.team.background,
        borderColor: chartColors.value.team.border,
        borderWidth: 2,
        pointBackgroundColor: chartColors.value.team.point,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: chartColors.value.team.border,
        data: [
          percentage.value.teamAvgDamageDealtToChampionsRatioToMax,
          percentage.value.teamAvgDamageTakenRatioToMax,
          percentage.value.teamAvgGoldEarnedRatioToMax,
          percentage.value.teamAvgCsRatioToMax,
          percentage.value.teamAvgKdaRatioToMax,
          percentage.value.teamAvgKillParticipationRatioToMax,
          percentage.value.teamAvgTotalHealRatioToMax
        ]
      }
    ]
  }
})

const options = computed<ChartOptions<'radar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: Math.max(window.devicePixelRatio, 2),
  animation: {
    duration: 500
  },
  scales: {
    r: {
      min: 0,
      max: 1,
      ticks: {
        display: false
      },
      grid: { color: chartColors.value.grid },
      angleLines: { color: chartColors.value.angle },
      pointLabels: { color: chartColors.value.label }
    }
  },
  plugins: {
    datalabels: {
      display: false
    },
    legend: {
      labels: {
        color: chartColors.value.legend
      }
    },
    tooltip: {
      backgroundColor: chartColors.value.tooltipBg,
      borderColor: chartColors.value.tooltipBorder,
      borderWidth: 1,
      titleColor: chartColors.value.tooltipTitle,
      bodyColor: chartColors.value.tooltipBody,
      callbacks: {
        label(context: TooltipItem<'radar'>) {
          const label = context.dataset.label ? `${context.dataset.label}: ` : ''
          const value = typeof context.parsed.r === 'number' ? context.parsed.r : 0
          return `${label}${(value * 100).toFixed(1)}%`
        }
      }
    }
  }
}))
</script>
