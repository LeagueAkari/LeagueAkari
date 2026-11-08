<template>
  <section
    class="flex flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
  >
    <div v-if="showHeader" class="flex flex-wrap items-baseline justify-between gap-2">
      <span class="text-sm font-bold text-black/85 dark:text-white/85">
        {{ t('selfImprovement.recentMatches.title') }}
      </span>
      <span class="text-[11px] text-black/40 dark:text-white/40">
        {{ t('selfImprovement.recentMatches.description', { count: rows.length }) }}
      </span>
    </div>

    <NDataTable
      size="small"
      :bordered="false"
      :pagination="false"
      :columns="columns"
      :data="rows"
      :scroll-x="860"
      :theme-overrides="themeOverrides"
    />
  </section>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { type DataTableColumns, NDataTable } from 'naive-ui'
import { computed, h } from 'vue'

import type { SelfImprovementMatch } from '../data/self-improvement-metrics'
import { SELF_IMPROVEMENT_RECENT_MATCH_LIMIT } from '../data/self-improvement-metrics'

const RECENT_MATCH_LIMIT = SELF_IMPROVEMENT_RECENT_MATCH_LIMIT

interface RecentMatchRow {
  key: number
  date: string
  champion: string
  win: boolean
  result: string
  kda: string
  cs: number
  csPerMinute: string
  goldPerMinute: string
  visionScorePerMinute: string
  damagePerMinute: string
  duration: string
}

const props = withDefaults(
  defineProps<{
    matches: SelfImprovementMatch[]
    showHeader?: boolean
  }>(),
  {
    showHeader: true
  }
)

const { t } = useTranslation()
const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

const rows = computed<RecentMatchRow[]>(() => {
  return props.matches
    .slice(-RECENT_MATCH_LIMIT)
    .reverse()
    .map((match) => ({
      key: match.gameId,
      date: dayjs(match.gameCreation).format('MM-DD HH:mm'),
      champion: lcs.gameData.championName(match.championId),
      win: match.win,
      result: match.win ? t('selfImprovement.charts.win') : t('selfImprovement.charts.loss'),
      kda: `${match.kills}/${match.deaths}/${match.assists}`,
      cs: match.cs,
      csPerMinute: match.csPerMinute.toFixed(1),
      goldPerMinute: match.goldPerMinute.toFixed(0),
      visionScorePerMinute: match.visionScorePerMinute.toFixed(1),
      damagePerMinute: match.damagePerMinute.toFixed(0),
      duration: formatDuration(match.gameDuration)
    }))
})

const columns = computed<DataTableColumns<RecentMatchRow>>(() => [
  {
    title: t('selfImprovement.recentMatches.columns.date'),
    key: 'date',
    width: 106
  },
  {
    title: t('selfImprovement.recentMatches.columns.champion'),
    key: 'champion',
    width: 132
  },
  {
    title: t('selfImprovement.recentMatches.columns.result'),
    key: 'result',
    width: 72,
    render: (row) =>
      h(
        'span',
        {
          class: row.win ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        },
        row.result
      )
  },
  {
    title: t('selfImprovement.recentMatches.columns.kda'),
    key: 'kda',
    align: 'right',
    width: 86
  },
  {
    title: t('selfImprovement.recentMatches.columns.cs'),
    key: 'cs',
    align: 'right',
    width: 76
  },
  {
    title: t('selfImprovement.recentMatches.columns.csPerMinute'),
    key: 'csPerMinute',
    align: 'right',
    width: 96
  },
  {
    title: t('selfImprovement.recentMatches.columns.goldPerMinute'),
    key: 'goldPerMinute',
    align: 'right',
    width: 96
  },
  {
    title: t('selfImprovement.recentMatches.columns.visionScorePerMinute'),
    key: 'visionScorePerMinute',
    align: 'right',
    width: 96
  },
  {
    title: t('selfImprovement.recentMatches.columns.damagePerMinute'),
    key: 'damagePerMinute',
    align: 'right',
    width: 96
  },
  {
    title: t('selfImprovement.recentMatches.columns.duration'),
    key: 'duration',
    align: 'right',
    width: 76
  }
])

const themeOverrides = computed(() => {
  if (as.colorTheme === 'dark') {
    return {
      thColor: 'rgba(23, 23, 23, 0.3)',
      tdColor: 'rgba(23, 23, 23, 0.2)'
    }
  }

  return {
    thColor: 'rgba(15, 23, 42, 0.04)',
    tdColor: 'rgba(15, 23, 42, 0.02)'
  }
})
</script>
