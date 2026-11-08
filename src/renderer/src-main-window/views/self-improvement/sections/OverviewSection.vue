<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <span class="text-base font-bold text-black/85 dark:text-white/85">
        {{ t('selfImprovement.sections.overview') }}
      </span>
      <span class="text-[11px] text-black/40 dark:text-white/40">
        {{ t('selfImprovement.sections.overviewHint') }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <SelfImprovementKpiCard
        v-for="kpi in kpis"
        :key="kpi.label"
        :label="kpi.label"
        :value="kpi.value"
        :delta="kpi.delta"
        :no-delta-text="t('selfImprovement.summary.noComparison')"
      />
    </div>

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
              recent: recentWindowCount,
              previous: previousWindowCount
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

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs text-black/50 dark:text-white/50">
        {{
          t('selfImprovement.summary.windowDescription', {
            count: recentWindowCount,
            previous: previousWindowCount,
            total: visibleMatches.length
          })
        }}
      </div>
      <div class="text-[11px] text-black/40 dark:text-white/40">
        {{ t('selfImprovement.footnote') }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import SelfImprovementKpiCard from '../components/SelfImprovementKpiCard.vue'
import type { SelfImprovementKpiDelta } from '../components/types'
import { useSelfImprovementPageContext } from '../context'
import {
  buildSelfImprovementInsights,
  evaluateSelfImprovementEconomyStanding,
  type SelfImprovementInsight,
  type SelfImprovementInsightCode,
  type SelfImprovementSummary
} from '../data/self-improvement-metrics'

const { t } = useTranslation()
const { windowComparison, visibleMatches, buckets } = useSelfImprovementPageContext()

const recentWindowCount = computed(() => windowComparison.value.recent.count)
const previousWindowCount = computed(() => windowComparison.value.previous.count)
const hasPreviousWindow = computed(() => previousWindowCount.value > 0)

const insights = computed(() => buildSelfImprovementInsights(windowComparison.value))

const economyStanding = computed(() =>
  buckets.value.length >= 2 ? evaluateSelfImprovementEconomyStanding(buckets.value) : null
)

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

const formatRate = (value: number) => value.toFixed(1)
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

const createKpiDelta = (
  current: number,
  previous: number,
  options: { digits?: number; percent?: boolean; betterWhenHigher?: boolean } = {}
): SelfImprovementKpiDelta | null => {
  if (!hasPreviousWindow.value) {
    return null
  }

  const diff = current - previous
  const digits = options.digits ?? 1

  if (Math.abs(diff) < 10 ** -(digits + 2)) {
    return {
      text: options.percent ? '0.0%' : '0.0',
      hint: t('selfImprovement.summary.deltaHint', { count: previousWindowCount.value }),
      direction: 'up',
      positive: true
    }
  }

  const magnitude = Math.abs(diff)
  const formatted = options.percent
    ? `${(magnitude * 100).toFixed(digits)}%`
    : magnitude.toFixed(digits)
  const betterWhenHigher = options.betterWhenHigher ?? true

  return {
    text: `${diff > 0 ? '+' : '-'}${formatted}`,
    hint: t('selfImprovement.summary.deltaHint', { count: previousWindowCount.value }),
    direction: diff > 0 ? 'up' : 'down',
    positive: diff > 0 === betterWhenHigher
  }
}

const kpis = computed(() => {
  const recent: SelfImprovementSummary = windowComparison.value.recent
  const previous: SelfImprovementSummary = windowComparison.value.previous

  return [
    {
      label: t('selfImprovement.summary.csPerMinute'),
      value: formatRate(recent.csPerMinute),
      delta: createKpiDelta(recent.csPerMinute, previous.csPerMinute)
    },
    {
      label: t('selfImprovement.summary.goldPerMinute'),
      value: recent.goldPerMinute.toFixed(0),
      delta: createKpiDelta(recent.goldPerMinute, previous.goldPerMinute, { digits: 0 })
    },
    {
      label: t('selfImprovement.summary.kda'),
      value: recent.kda.toFixed(2),
      delta: createKpiDelta(recent.kda, previous.kda, { digits: 2 })
    },
    {
      label: t('selfImprovement.summary.visionScorePerMinute'),
      value: formatRate(recent.visionScorePerMinute),
      delta: createKpiDelta(recent.visionScorePerMinute, previous.visionScorePerMinute)
    },
    {
      label: t('selfImprovement.summary.winRate'),
      value: formatPercent(recent.winRate),
      delta: createKpiDelta(recent.winRate, previous.winRate, { percent: true })
    }
  ]
})
</script>
