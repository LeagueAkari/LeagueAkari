<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-baseline gap-2">
        <span class="text-base font-bold text-black/85 dark:text-white/85">
          {{ t('selfImprovement.sections.details') }}
        </span>
        <span class="text-[11px] text-black/40 dark:text-white/40">
          {{ t('selfImprovement.sections.detailsHint') }}
        </span>
      </div>

      <NRadioGroup v-model:value="selectedCategory" size="small">
        <NRadioButton value="economy">
          {{ t('selfImprovement.categories.economy') }}
        </NRadioButton>
        <NRadioButton value="combat">
          {{ t('selfImprovement.categories.combat') }}
        </NRadioButton>
        <NRadioButton value="vision">
          {{ t('selfImprovement.categories.vision') }}
        </NRadioButton>
      </NRadioGroup>
    </div>

    <div class="text-xs text-black/50 dark:text-white/50">
      {{ t(`selfImprovement.panes.${selectedCategory}.description`) }}
    </div>

    <SelfImprovementChartGrid
      v-if="selectedCategory === 'economy'"
      :charts="economyCharts"
      :columns="3"
    />
    <SelfImprovementChartGrid v-else-if="selectedCategory === 'combat'" :charts="combatCharts" />
    <SelfImprovementChartGrid v-else :charts="visionCharts" />

    <section
      v-if="selectedCategory === 'economy'"
      class="flex flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="text-sm font-bold text-black/85 dark:text-white/85">
          {{
            t('selfImprovement.buckets.title', {
              size: SELF_IMPROVEMENT_BUCKET_SIZE
            })
          }}
        </span>
        <span class="text-[11px] text-black/40 dark:text-white/40">
          {{ t('selfImprovement.buckets.description') }}
        </span>
      </div>

      <NDataTable
        size="small"
        :bordered="false"
        :pagination="false"
        :columns="bucketColumns"
        :data="bucketRows"
        :theme-overrides="dataTableThemeOverrides"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { type DataTableColumns, NDataTable, NRadioButton, NRadioGroup } from 'naive-ui'
import { computed, ref } from 'vue'

import SelfImprovementChartGrid from '../components/SelfImprovementChartGrid.vue'
import { useSelfImprovementPageContext } from '../context'
import { SELF_IMPROVEMENT_BUCKET_SIZE } from '../data/self-improvement-metrics'

type DetailCategory = 'economy' | 'combat' | 'vision'

interface BucketRow {
  key: string
  range: string
  count: number
  csPerMinute: string
  goldPerMinute: string
  kda: string
  winRate: string
}

const { t } = useTranslation()
const as = useAppCommonStore()
const { chartMap, buckets } = useSelfImprovementPageContext()

const selectedCategory = ref<DetailCategory>('economy')

const economyCharts = computed(() => [
  chartMap.value.csPerMinute,
  chartMap.value.goldPerMinute,
  chartMap.value.cs
])

const combatCharts = computed(() => [
  chartMap.value.kda,
  chartMap.value.damagePerMinute,
  chartMap.value.damageGoldEfficiency,
  chartMap.value.damageShare
])

const visionCharts = computed(() => [
  chartMap.value.visionScorePerMinute,
  chartMap.value.wardsPlaced,
  chartMap.value.wardsKilled,
  chartMap.value.visionWardsBoughtInGame
])

const bucketRows = computed<BucketRow[]>(() =>
  buckets.value.map((bucket) => ({
    key: `${bucket.startGameCreation}-${bucket.endGameCreation}`,
    range: `${dayjs(bucket.startGameCreation).format('YYYY-MM-DD')} ~ ${dayjs(
      bucket.endGameCreation
    ).format('YYYY-MM-DD')}`,
    count: bucket.summary.count,
    csPerMinute: bucket.summary.csPerMinute.toFixed(1),
    goldPerMinute: bucket.summary.goldPerMinute.toFixed(0),
    kda: bucket.summary.kda.toFixed(2),
    winRate: `${(bucket.summary.winRate * 100).toFixed(1)}%`
  }))
)

const bucketColumns = computed<DataTableColumns<BucketRow>>(() => [
  {
    title: t('selfImprovement.buckets.columns.range'),
    key: 'range'
  },
  {
    title: t('selfImprovement.buckets.columns.matches'),
    key: 'count',
    align: 'right',
    width: 80
  },
  {
    title: t('selfImprovement.buckets.columns.csPerMinute'),
    key: 'csPerMinute',
    align: 'right'
  },
  {
    title: t('selfImprovement.buckets.columns.goldPerMinute'),
    key: 'goldPerMinute',
    align: 'right'
  },
  {
    title: t('selfImprovement.buckets.columns.kda'),
    key: 'kda',
    align: 'right'
  },
  {
    title: t('selfImprovement.buckets.columns.winRate'),
    key: 'winRate',
    align: 'right'
  }
])

const dataTableThemeOverrides = computed(() => {
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
