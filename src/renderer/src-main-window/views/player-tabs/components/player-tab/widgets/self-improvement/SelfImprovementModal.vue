<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="t('selfImprovement.summary.title')"
    style="width: min(1200px, 94vw)"
    content-style="padding: 12px"
  >
    <template #header-extra>
      <div class="flex items-center gap-1 text-xs text-black/45 dark:text-white/45">
        <span>{{ t('selfImprovement.summary.pageSize', { count: pageSize }) }}</span>
        <span>·</span>
        <span>{{ t('selfImprovement.summary.validCount', { count: visibleMatches.length }) }}</span>
      </div>
    </template>

    <NScrollbar style="max-height: 76vh">
      <div class="flex flex-col gap-4 pr-4">
        <div class="grid gap-3 lg:grid-cols-[1.618fr_1fr]">
          <section
            class="flex flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="text-sm font-bold text-black/85 dark:text-white/85">
                {{ t('selfImprovement.insights.title') }}
              </span>
              <span class="text-[11px] text-black/40 dark:text-white/40">
                {{
                  t('selfImprovement.insights.description', {
                    recent: recentCount,
                    previous: previousCount
                  })
                }}
              </span>
            </div>

            <ul v-if="insights.length" class="flex flex-wrap gap-1.5">
              <li
                v-for="insight in insights"
                :key="insight.code"
                class="rounded-xs border-l-2 px-2 py-1 text-xs"
                :class="insightClass(insight.tone)"
              >
                {{ t(insightTextKeys[insight.code], { value: formatInsightValue(insight) }) }}
              </li>
            </ul>
            <div v-else class="text-xs text-black/45 dark:text-white/45">
              {{ t('selfImprovement.insights.notEnough') }}
            </div>

            <div
              v-if="economyStanding"
              class="rounded-xs bg-black/5 px-2 py-1 text-xs text-black/65 dark:bg-white/5 dark:text-white/65"
            >
              {{
                t('selfImprovement.insights.economyStanding', {
                  latest: economyStanding.latestGoldPerMinute.toFixed(0),
                  best: economyStanding.bestGoldPerMinute.toFixed(0),
                  gap: economyStanding.gapToBest.toFixed(0),
                  rank: economyStanding.latestRank,
                  total: economyStanding.bucketCount
                })
              }}
            </div>
          </section>

          <section
            v-if="positionOptions.length > 0"
            class="flex flex-col gap-3 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="text-sm font-bold text-black/85 dark:text-white/85">
                {{ t('selfImprovement.positionDistribution.title') }}
              </span>
              <span class="text-[11px] text-black/40 dark:text-white/40">
                {{ t('selfImprovement.positionDistribution.description') }}
              </span>
            </div>
            <PositionDistributionPane />
          </section>
        </div>

        <section class="flex flex-col gap-3">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-base font-bold text-black/85 dark:text-white/85">
                {{ t('selfImprovement.sections.details') }}
              </span>
              <span class="text-[11px] text-black/40 dark:text-white/40">
                {{ t('selfImprovement.sections.detailsHint') }}
              </span>
            </div>

            <div class="mr-3 flex shrink-0 flex-nowrap items-center gap-2">
              <div v-if="positionOptions.length > 0" class="w-32 shrink-0">
                <NSelect
                  :value="selectedPosition"
                  class="w-full"
                  size="small"
                  clearable
                  :placeholder="t('selfImprovement.summary.allPositions')"
                  :options="positionOptions"
                  @update:value="handlePositionUpdate"
                />
              </div>
              <NRadioGroup v-model:value="selectedCategory" class="shrink-0" size="small">
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
          </div>

          <div class="text-xs text-black/50 dark:text-white/50">
            {{ t(`selfImprovement.panes.${selectedCategory}.description`) }}
          </div>

          <SelfImprovementChartGrid
            v-if="selectedCategory === 'economy'"
            :charts="economyCharts"
            :columns="3"
          />
          <SelfImprovementChartGrid
            v-else-if="selectedCategory === 'combat'"
            :charts="combatCharts"
          />
          <SelfImprovementChartGrid v-else :charts="visionCharts" />

          <section
            v-if="selectedCategory === 'economy'"
            class="flex flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="text-sm font-bold text-black/85 dark:text-white/85">
                {{ t('selfImprovement.buckets.title', { size: SELF_IMPROVEMENT_BUCKET_SIZE }) }}
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
      </div>
    </NScrollbar>
  </NModal>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  type DataTableColumns,
  NDataTable,
  NModal,
  NRadioButton,
  NRadioGroup,
  NScrollbar,
  NSelect
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useMatchHistory } from '../../data/match-history'
import PositionDistributionPane from './PositionDistributionPane.vue'
import SelfImprovementChartGrid from './components/SelfImprovementChartGrid.vue'
import { useSelfImprovementAnalysis } from './composables/useSelfImprovementAnalysis'
import {
  SELF_IMPROVEMENT_BUCKET_SIZE,
  type SelfImprovementInsight,
  type SelfImprovementInsightCode,
  type SelfImprovementMatch
} from './data/self-improvement-metrics'

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

const props = defineProps<{
  show: boolean
  matches: SelfImprovementMatch[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const { t } = useTranslation()
const { t: tCommon } = useTranslation('common')
const as = useAppCommonStore()
const { page } = useMatchHistory()

const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

const selectedPosition = ref<string | null>(null)

const positionOptions = computed(() => {
  const available = new Set(props.matches.map((match) => match.position))

  return POSITIONS.filter((position) => available.has(position)).map((position) => ({
    value: position,
    label: tCommon(`positions.${position}`)
  }))
})

const visibleMatches = computed(() =>
  selectedPosition.value
    ? props.matches.filter((match) => match.position === selectedPosition.value)
    : props.matches
)

const pageSize = computed(() => page.value?.queryParams.count ?? props.matches.length)

const handlePositionUpdate = (value: string | null) => {
  selectedPosition.value = value
}

watch(positionOptions, (options) => {
  if (
    selectedPosition.value &&
    !options.some((option) => option.value === selectedPosition.value)
  ) {
    selectedPosition.value = null
  }
})

const analysis = useSelfImprovementAnalysis(() => visibleMatches.value)

const insights = analysis.insights
const economyStanding = analysis.economyStanding
const buckets = analysis.buckets
const chartMap = analysis.chartMap

const recentCount = computed(() => analysis.windowComparison.value.recent.count)
const previousCount = computed(() => analysis.windowComparison.value.previous.count)

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

const insightTextKeys: Record<SelfImprovementInsightCode, string> = {
  economyUp: 'selfImprovement.insights.economyUp',
  economyDown: 'selfImprovement.insights.economyDown',
  farmingUp: 'selfImprovement.insights.farmingUp',
  farmingDown: 'selfImprovement.insights.farmingDown',
  combatUp: 'selfImprovement.insights.combatUp',
  combatDown: 'selfImprovement.insights.combatDown',
  visionUp: 'selfImprovement.insights.visionUp',
  visionDown: 'selfImprovement.insights.visionDown',
  winRateUp: 'selfImprovement.insights.winRateUp',
  winRateDown: 'selfImprovement.insights.winRateDown',
  stable: 'selfImprovement.insights.stable'
}

const formatInsightValue = (insight: SelfImprovementInsight) => {
  if (insight.code === 'winRateUp' || insight.code === 'winRateDown') {
    return `${(insight.value * 100).toFixed(1)}%`
  }

  if (insight.code === 'combatUp' || insight.code === 'combatDown') {
    return insight.value.toFixed(2)
  }

  if (insight.code === 'economyUp' || insight.code === 'economyDown') {
    return insight.value.toFixed(0)
  }

  return insight.value.toFixed(1)
}

const insightClass = (tone: SelfImprovementInsight['tone']) => {
  if (tone === 'warning') {
    return 'border-amber-500/70 bg-amber-500/10 text-amber-800 dark:text-amber-200'
  }

  if (tone === 'positive') {
    return 'border-green-500/70 bg-green-500/10 text-green-800 dark:text-green-200'
  }

  return 'border-black/15 bg-black/5 text-black/70 dark:border-white/15 dark:bg-white/5 dark:text-white/70'
}

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
  { title: t('selfImprovement.buckets.columns.range'), key: 'range' },
  {
    title: t('selfImprovement.buckets.columns.matches'),
    key: 'count',
    align: 'right',
    width: 80
  },
  { title: t('selfImprovement.buckets.columns.csPerMinute'), key: 'csPerMinute', align: 'right' },
  {
    title: t('selfImprovement.buckets.columns.goldPerMinute'),
    key: 'goldPerMinute',
    align: 'right'
  },
  { title: t('selfImprovement.buckets.columns.kda'), key: 'kda', align: 'right' },
  { title: t('selfImprovement.buckets.columns.winRate'), key: 'winRate', align: 'right' }
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
