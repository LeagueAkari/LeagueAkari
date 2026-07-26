<template>
  <div
    class="w-140 max-w-[calc(100vw-2rem)] text-xs text-black/75 dark:text-white/75"
    data-testid="champion-analysis-content"
  >
    <div class="flex items-center gap-2.5">
      <ChampionIcon :champion-id="analysis.championId" class="size-8 shrink-0 rounded" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-bold text-black/90 dark:text-white/90">
          {{ resources.champions.name(analysis.championId) }}
        </div>
        <div
          class="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] leading-4 text-black/45 dark:text-white/45"
        >
          <span
            v-for="(item, index) in headerSummaryItems"
            :key="index"
            class="inline-flex h-4 items-center gap-1"
          >
            <span v-if="index > 0" aria-hidden="true">·</span>
            <span>{{ item }}</span>
          </span>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <div class="flex shrink-0 flex-col items-center leading-none">
          <div
            class="text-[13px] font-bold tabular-nums"
            :class="{
              'text-green-700 dark:text-green-300': analysis.winLoss.all.winRate >= 0.53,
              'text-black/80 dark:text-white/80':
                analysis.winLoss.all.winRate > 0.47 && analysis.winLoss.all.winRate < 0.53,
              'text-red-700 dark:text-red-400': analysis.winLoss.all.winRate <= 0.47
            }"
          >
            {{ formatPercent(analysis.winLoss.all.winRate) }}
          </div>
          <div class="mt-0.5 text-[9px] leading-3 text-black/45 dark:text-white/45">
            {{ t('championAnalysis.winRate') }}
          </div>
        </div>
        <NButton
          v-if="onCollectMatches"
          secondary
          size="tiny"
          type="primary"
          class="shrink-0"
          :aria-label="collectMatchesLabel"
          :title="collectMatchesLabel"
          :loading="collecting"
          @click="onCollectMatches"
        >
          <template #icon>
            <NIcon><ManageSearchFilledIcon /></NIcon>
          </template>
          {{ t('championAnalysis.collectShort') }}
        </NButton>
      </div>
    </div>

    <NTabs class="mt-1.5" type="line" size="small" :animated="false" default-value="overview">
      <NTabPane name="overview">
        <template #tab>
          <span class="inline-flex items-center gap-1.5">
            <NIcon size="14"><InsightsRoundIcon /></NIcon>
            <span>{{ t('championAnalysis.overviewTab') }}</span>
          </span>
        </template>
        <StablePane>
          <div
            class="grid h-full grid-cols-3 gap-4"
            data-testid="champion-analysis-compact-overview"
          >
            <div class="min-w-0">
              <div
                v-if="analysis.winLoss.normal.count > 0 && analysis.winLoss.cherry.count > 0"
                class="mb-2 grid grid-cols-2 gap-1.5"
              >
                <div class="rounded bg-black/4 px-2 py-1 dark:bg-white/6">
                  <div class="text-[10px] text-black/45 dark:text-white/45">
                    {{ t('championAnalysis.standardModes') }}
                  </div>
                  <div
                    class="mt-0.5 truncate font-semibold text-black/80 tabular-nums dark:text-white/80"
                  >
                    {{ formatPercent(analysis.winLoss.normal.winRate) }} ·
                    {{ winLossText(analysis.winLoss.normal) }}
                  </div>
                </div>
                <div class="rounded bg-black/4 px-2 py-1 dark:bg-white/6">
                  <div class="text-[10px] text-black/45 dark:text-white/45">
                    {{ t('championAnalysis.arena') }}
                  </div>
                  <div
                    class="mt-0.5 truncate font-semibold text-black/80 tabular-nums dark:text-white/80"
                  >
                    {{ t('championAnalysis.arenaSummary', arenaSummaryValues) }}
                  </div>
                </div>
              </div>
              <div
                v-else-if="analysis.winLoss.cherry.count > 0"
                class="mb-2 grid grid-cols-3 gap-1.5"
              >
                <MetricCell
                  :label="t('championAnalysis.top1Rate')"
                  :value="formatPercent(analysis.winLoss.cherry.top1Rate)"
                />
                <MetricCell
                  :label="t('championAnalysis.topHalfRate')"
                  :value="formatPercent(analysis.winLoss.cherry.topHalfRate)"
                />
                <MetricCell
                  :label="t('championAnalysis.averagePlacement')"
                  :value="analysis.winLoss.cherry.avgSubteamPlacement.toFixed(1)"
                />
              </div>

              <CompactAnalysisSection
                :title="t('championAnalysis.performance')"
                :metrics="overviewMetrics"
              />
            </div>

            <CompactAnalysisSection
              :title="t('championAnalysis.damage')"
              :metrics="combatMetrics"
            />

            <CompactAnalysisSection
              :title="t('championAnalysis.economy')"
              :metrics="developmentMetrics"
            />
          </div>
        </StablePane>
      </NTabPane>

      <NTabPane v-if="hasPositionData" name="position">
        <template #tab>
          <span class="inline-flex items-center gap-1.5">
            <NIcon size="14"><DonutSmallRoundIcon /></NIcon>
            <span>{{ t('championAnalysis.positionTab') }}</span>
          </span>
        </template>
        <StablePane>
          <ChampionPositionChart :positions="analysis.positions!" class="h-full" />
        </StablePane>
      </NTabPane>

      <NTabPane v-if="analysis.jungle" name="jungle">
        <template #tab>
          <span class="inline-flex items-center gap-1.5">
            <NIcon size="14"><ForestRoundIcon /></NIcon>
            <span>{{ t('championAnalysis.jungleTab') }}</span>
          </span>
        </template>
        <StablePane>
          <div class="mb-1.5 text-[10px] text-black/45 dark:text-white/45">
            {{ t('championAnalysis.gamesAnalyzed', { count: analysis.jungle.gamesAnalyzed }) }}
          </div>
          <JunglePathingContent :stats="analysis.jungle" />
        </StablePane>
      </NTabPane>

      <NTabPane v-if="mastery" name="mastery">
        <template #tab>
          <span class="inline-flex items-center gap-1.5">
            <NIcon size="14"><MilitaryTechRoundIcon /></NIcon>
            <span>{{ t('championAnalysis.masteryTab') }}</span>
          </span>
        </template>
        <StablePane>
          <ChampionMasteryContent :mastery="mastery" />
        </StablePane>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="tsx">
import { AkariScorePopover } from '@renderer-shared/components/akari-score'
import { JunglePathingContent } from '@renderer-shared/components/jungle-pathing-analysis'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource/context'
import type {
  AggregatedChampionAnalysis,
  AggregatedWinLossAnalysis,
  AkariScore
} from '@shared/data-adapter/analysis/player'
import {
  DonutSmallRound as DonutSmallRoundIcon,
  ForestRound as ForestRoundIcon,
  InsightsRound as InsightsRoundIcon,
  ManageSearchFilled as ManageSearchFilledIcon,
  MilitaryTechRound as MilitaryTechRoundIcon
} from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NTabPane, NTabs } from 'naive-ui'
import { computed, defineComponent, type PropType } from 'vue'

import ChampionMasteryContent from './ChampionMasteryContent.vue'
import ChampionPositionChart from './ChampionPositionChart.vue'
import type { ChampionAnalysisMastery } from './types'

interface Metric {
  label: string
  value: string
  detail?: string
  akariScore?: AkariScore
}

const props = defineProps<{
  analysis: AggregatedChampionAnalysis
  mastery?: ChampionAnalysisMastery | null
  collecting?: boolean
  onCollectMatches?: () => void
}>()

const { t } = useTranslation('common')
const resources = useAkariResourceProvider()

const MetricCell = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    detail: { type: String, default: '' }
  },
  setup(cellProps) {
    return () => (
      <div class="min-w-0 rounded bg-black/4 px-2 py-1.5 dark:bg-white/6">
        <div class="truncate text-[10px] text-black/45 dark:text-white/45">{cellProps.label}</div>
        <div class="mt-0.5 font-semibold text-black/85 tabular-nums dark:text-white/85">
          {cellProps.value}
        </div>
        {cellProps.detail ? (
          <div class="mt-0.5 truncate text-[9px] text-black/40 tabular-nums dark:text-white/40">
            {cellProps.detail}
          </div>
        ) : null}
      </div>
    )
  }
})

const StablePane = defineComponent({
  setup(_, { slots }) {
    return () => (
      <div class="h-56 overflow-y-auto pr-0.5" data-testid="champion-analysis-core-pane">
        {slots.default?.()}
      </div>
    )
  }
})

const CompactAnalysisSection = defineComponent({
  props: {
    title: { type: String, required: true },
    metrics: { type: Array as PropType<Metric[]>, required: true }
  },
  setup(sectionProps) {
    return () => (
      <div class="min-w-0">
        <div class="mb-1 flex items-center gap-1.5 leading-4 font-bold text-black/85 dark:text-white/85">
          <span class="h-3 w-0.5 rounded-full bg-current opacity-35" />
          <span>{sectionProps.title}</span>
        </div>
        <div>
          {sectionProps.metrics.map((metric) => (
            <div
              key={metric.label}
              class="box-border flex h-5 items-baseline gap-2 border-b border-black/5 py-0.5 leading-4 last:border-b-0 dark:border-white/6"
            >
              <span class="min-w-0 flex-1 truncate text-[11px] text-black/55 dark:text-white/55">
                {metric.label}
              </span>
              {metric.detail ? (
                <span class="shrink-0 text-[10px] text-black/40 tabular-nums dark:text-white/40">
                  {metric.detail}
                </span>
              ) : null}
              {metric.akariScore ? (
                <AkariScorePopover score={metric.akariScore}>
                  <span class="shrink-0 cursor-default font-semibold text-black/85 tabular-nums dark:text-white/85">
                    {metric.value}
                  </span>
                </AkariScorePopover>
              ) : (
                <span class="shrink-0 font-semibold text-black/85 tabular-nums dark:text-white/85">
                  {metric.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
})

const formatPercent = (value: number, digits = 0) => `${(value * 100).toFixed(digits)}%`
const formatNumber = (value: number, digits = 1) => value.toFixed(digits)

const winLossText = (value: AggregatedWinLossAnalysis) =>
  t('championAnalysis.winsLosses', { wins: value.wins, losses: value.losses })

const streakText = computed(() => {
  const { winningStreak, losingStreak } = props.analysis.winLoss.all
  if (winningStreak >= 2) return t('championAnalysis.winningStreak', { count: winningStreak })
  if (losingStreak >= 2) return t('championAnalysis.losingStreak', { count: losingStreak })
  return ''
})

const activeSessionText = computed(() => {
  const { activeSessionWins, activeSessionLosses } = props.analysis.winLoss.all
  if (activeSessionWins + activeSessionLosses === 0) return ''
  return t('championAnalysis.activeSession', {
    wins: activeSessionWins,
    losses: activeSessionLosses
  })
})

const headerSummaryItems = computed(() =>
  [
    t('championAnalysis.games', { count: props.analysis.winLoss.all.count }),
    winLossText(props.analysis.winLoss.all),
    streakText.value,
    activeSessionText.value
  ].filter(Boolean)
)

const collectMatchesLabel = computed(() =>
  t('championAnalysis.collectMatches', {
    champion: resources.champions.name(props.analysis.championId)
  })
)

const arenaSummaryValues = computed(() => ({
  count: props.analysis.winLoss.cherry.count,
  top1Rate: formatPercent(props.analysis.winLoss.cherry.top1Rate),
  topHalfRate: formatPercent(props.analysis.winLoss.cherry.topHalfRate),
  placement: props.analysis.winLoss.cherry.avgSubteamPlacement.toFixed(1)
}))

const averageKdaLine = computed(() => {
  const count = Math.max(props.analysis.winLoss.all.count, 1)
  const { kills, deaths, assists } = props.analysis.summary
  return `${formatNumber(kills / count)} / ${formatNumber(deaths / count)} / ${formatNumber(assists / count)}`
})

const overviewMetrics = computed<Metric[]>(() => {
  const summary = props.analysis.summary
  const metrics: Metric[] = [
    {
      label: t('championAnalysis.akariScore'),
      value: props.analysis.akariScore.total.toFixed(2),
      akariScore: props.analysis.akariScore
    },
    {
      label: t('championAnalysis.winRate'),
      value: formatPercent(props.analysis.winLoss.all.winRate)
    },
    {
      label: t('championAnalysis.averageKda'),
      value: summary.avgKda.toFixed(2),
      detail: averageKdaLine.value
    },
    {
      label: t('championAnalysis.killParticipation'),
      value: formatPercent(summary.avgKillParticipation)
    },
    {
      label: t('championAnalysis.kdaVariation'),
      value: summary.kdaCv.toFixed(2)
    },
    {
      label: t('championAnalysis.visionScore'),
      value: formatNumber(summary.avgVisionScore)
    },
    {
      label: t('championAnalysis.visionShare'),
      value: formatPercent(summary.avgVisionScorePercentageOfTeam)
    }
  ]

  if (summary.avgPings !== null) {
    metrics.push({ label: t('championAnalysis.pings'), value: formatNumber(summary.avgPings) })
  }
  if (summary.avgEnemyMissingPings !== null) {
    metrics.push({
      label: t('championAnalysis.missingPings'),
      value: formatNumber(summary.avgEnemyMissingPings)
    })
  }

  return metrics
})

const combatMetrics = computed<Metric[]>(() => {
  const summary = props.analysis.summary
  const metrics: Metric[] = [
    {
      label: t('championAnalysis.damagePerMinute'),
      value: formatNumber(summary.avgChampionDamagePerMinute, 0)
    },
    {
      label: t('championAnalysis.damageShare'),
      value: formatPercent(summary.avgChampionDamagePercentageOfTeam)
    },
    {
      label: t('championAnalysis.damageToTeamMax'),
      value: formatPercent(summary.avgChampionDamageRatioToTeamMax)
    },
    {
      label: t('championAnalysis.damageToMatchMax'),
      value: formatPercent(summary.avgChampionDamageRatioToMax)
    },
    {
      label: t('championAnalysis.damageTakenShare'),
      value: formatPercent(summary.avgDamageTakenPercentageOfTeam)
    },
    {
      label: t('championAnalysis.damageTakenToTeamMax'),
      value: formatPercent(summary.avgDamageTakenRatioToTeamMax)
    },
    {
      label: t('championAnalysis.damageTakenToMatchMax'),
      value: formatPercent(summary.avgDamageTakenRatioToMax)
    },
    {
      label: t('championAnalysis.damageGoldEfficiency'),
      value: formatPercent(summary.avgDamageGoldEfficiency)
    },
    {
      label: t('championAnalysis.killDamageEfficiency'),
      value: summary.avgKillDamageEfficiency.toFixed(2)
    }
  ]

  if (summary.avgSoloKills !== null) {
    metrics.push({
      label: t('championAnalysis.soloKills'),
      value: formatNumber(summary.avgSoloKills)
    })
  }

  return metrics
})

const developmentMetrics = computed<Metric[]>(() => {
  const summary = props.analysis.summary
  return [
    {
      label: t('championAnalysis.goldShare'),
      value: formatPercent(summary.avgGoldPercentageOfTeam)
    },
    {
      label: t('championAnalysis.goldToTeamMax'),
      value: formatPercent(summary.avgGoldRatioToTeamMax)
    },
    {
      label: t('championAnalysis.goldToMatchMax'),
      value: formatPercent(summary.avgGoldRatioToMax)
    },
    {
      label: t('championAnalysis.csPerMinute'),
      value: formatNumber(summary.avgCsPerMinute)
    },
    {
      label: t('championAnalysis.csShare'),
      value: formatPercent(summary.avgCsPercentageOfTeam)
    },
    {
      label: t('championAnalysis.csToTeamMax'),
      value: formatPercent(summary.avgCsRatioToTeamMax)
    },
    {
      label: t('championAnalysis.csToMatchMax'),
      value: formatPercent(summary.avgCsRatioToMax)
    },
    {
      label: t('championAnalysis.towerDamageShare'),
      value: formatPercent(summary.avgTowerDamagePercentageOfTeam)
    },
    {
      label: t('championAnalysis.towerDamageToTeamMax'),
      value: formatPercent(summary.avgTowerDamageRatioToTeamMax)
    },
    {
      label: t('championAnalysis.towerDamageToMatchMax'),
      value: formatPercent(summary.avgTowerDamageRatioToMax)
    }
  ]
})

const hasPositionData = computed(
  () =>
    props.analysis.positions && Object.values(props.analysis.positions).some((count) => count > 0)
)
</script>
