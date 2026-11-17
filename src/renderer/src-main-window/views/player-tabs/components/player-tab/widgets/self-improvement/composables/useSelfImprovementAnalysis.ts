import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

import type { SelfImprovementChartView } from '../components/types'
import {
  SELF_IMPROVEMENT_BUCKET_SIZE,
  SELF_IMPROVEMENT_RECENT_WINDOW,
  type SelfImprovementMatch,
  type SelfImprovementMetricKey,
  buildSelfImprovementBuckets,
  buildSelfImprovementInsights,
  buildSelfImprovementMovingAverage,
  compareRecentSelfImprovementMatches,
  evaluateSelfImprovementEconomyStanding,
  getSelfImprovementMetricValue,
  sortSelfImprovementMatchesByTime,
  summarizeSelfImprovementMatches
} from '../data/self-improvement-metrics'

interface SelfImprovementChartConfig {
  key: SelfImprovementMetricKey
  title: string
  unit: string
  color: string
  precision?: number
  percent?: boolean
}

/**
 * 基于当前战绩筛选结果生成自我提升分析
 *
 * 不额外请求数据；分页、队列、时间等筛选由战绩页面负责。
 */
export function useSelfImprovementAnalysis(matches: MaybeRefOrGetter<SelfImprovementMatch[]>) {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()

  const orderedMatches = computed(() => sortSelfImprovementMatchesByTime(toValue(matches)))

  const windowComparison = computed(() =>
    compareRecentSelfImprovementMatches(orderedMatches.value, SELF_IMPROVEMENT_RECENT_WINDOW)
  )

  const overallSummary = computed(() => summarizeSelfImprovementMatches(orderedMatches.value))

  const buckets = computed(() =>
    buildSelfImprovementBuckets(orderedMatches.value, SELF_IMPROVEMENT_BUCKET_SIZE)
  )

  const insights = computed(() => buildSelfImprovementInsights(windowComparison.value))

  const economyStanding = computed(() =>
    buckets.value.length >= 2 ? evaluateSelfImprovementEconomyStanding(buckets.value) : null
  )

  const chartConfigs = computed<SelfImprovementChartConfig[]>(() => [
    {
      key: 'csPerMinute',
      title: t('selfImprovement.charts.csPerMinute'),
      unit: t('selfImprovement.units.csPerMinute'),
      color: '#38bdf8'
    },
    {
      key: 'goldPerMinute',
      title: t('selfImprovement.charts.goldPerMinute'),
      unit: t('selfImprovement.units.goldPerMinute'),
      color: '#f59e0b',
      precision: 0
    },
    {
      key: 'cs',
      title: t('selfImprovement.charts.cs'),
      unit: t('selfImprovement.units.cs'),
      color: '#22d3ee',
      precision: 0
    },
    {
      key: 'kda',
      title: t('selfImprovement.charts.kda'),
      unit: '',
      color: '#a78bfa',
      precision: 2
    },
    {
      key: 'damagePerMinute',
      title: t('selfImprovement.charts.damagePerMinute'),
      unit: t('selfImprovement.units.damagePerMinute'),
      color: '#fb7185',
      precision: 0
    },
    {
      key: 'damageGoldEfficiency',
      title: t('selfImprovement.charts.damageGoldEfficiency'),
      unit: '',
      color: '#fb923c',
      precision: 1,
      percent: true
    },
    {
      key: 'damageShare',
      title: t('selfImprovement.charts.damageShare'),
      unit: '',
      color: '#facc15',
      precision: 1,
      percent: true
    },
    {
      key: 'visionScorePerMinute',
      title: t('selfImprovement.charts.visionScorePerMinute'),
      unit: t('selfImprovement.units.visionScorePerMinute'),
      color: '#34d399'
    },
    {
      key: 'wardsPlaced',
      title: t('selfImprovement.charts.wardsPlaced'),
      unit: t('selfImprovement.units.wardsPlaced'),
      color: '#60a5fa',
      precision: 0
    },
    {
      key: 'wardsKilled',
      title: t('selfImprovement.charts.wardsKilled'),
      unit: t('selfImprovement.units.wardsKilled'),
      color: '#f472b6',
      precision: 0
    },
    {
      key: 'visionWardsBoughtInGame',
      title: t('selfImprovement.charts.visionWardsBoughtInGame'),
      unit: t('selfImprovement.units.visionWardsBoughtInGame'),
      color: '#c084fc',
      precision: 0
    }
  ])

  const averageOf = (getter: (match: SelfImprovementMatch) => number) => {
    if (orderedMatches.value.length === 0) {
      return 0
    }

    return (
      orderedMatches.value.reduce((acc, match) => acc + getter(match), 0) /
      orderedMatches.value.length
    )
  }

  const chartMap = computed(() => {
    const totalDamage = orderedMatches.value.reduce(
      (acc, match) => acc + match.damageToChampions,
      0
    )
    const totalGold = orderedMatches.value.reduce((acc, match) => acc + match.gold, 0)
    const totalTeamDamage = orderedMatches.value.reduce(
      (acc, match) => acc + match.teamDamageToChampions,
      0
    )

    const metricAverages: Record<SelfImprovementMetricKey, number> = {
      cs: averageOf((match) => match.cs),
      csPerMinute: overallSummary.value.csPerMinute,
      goldPerMinute: overallSummary.value.goldPerMinute,
      kda: overallSummary.value.kda,
      visionScorePerMinute: overallSummary.value.visionScorePerMinute,
      damagePerMinute: overallSummary.value.damagePerMinute,
      damageGoldEfficiency: totalGold > 0 ? totalDamage / totalGold : 0,
      damageShare: totalTeamDamage > 0 ? totalDamage / totalTeamDamage : 0,
      wardsPlaced: averageOf((match) => match.wardsPlaced),
      wardsKilled: averageOf((match) => match.wardsKilled),
      visionWardsBoughtInGame: averageOf((match) => match.visionWardsBoughtInGame)
    }

    const result = {} as Record<SelfImprovementMetricKey, SelfImprovementChartView>

    for (const config of chartConfigs.value) {
      const points = orderedMatches.value.map((match) => {
        const date = dayjs(match.gameCreation)

        return {
          label: date.format('MM-DD'),
          dateText: date.format('YYYY-MM-DD HH:mm'),
          championName: lcs.gameData.championName(match.championId),
          resultText: match.win
            ? t('selfImprovement.charts.win')
            : t('selfImprovement.charts.loss'),
          durationText: `${Math.floor(match.gameDuration / 60)}:${Math.floor(
            match.gameDuration % 60
          )
            .toString()
            .padStart(2, '0')}`,
          kdaText: `${match.kills}/${match.deaths}/${match.assists}`,
          win: match.win,
          value: getSelfImprovementMetricValue(match, config.key)
        }
      })

      result[config.key] = {
        ...config,
        points,
        average: metricAverages[config.key],
        ariaLabel: t('selfImprovement.charts.ariaLabel', {
          title: config.title,
          count: points.length
        }),
        movingAverage: buildSelfImprovementMovingAverage(
          points.map((point) => point.value),
          SELF_IMPROVEMENT_RECENT_WINDOW
        )
      }
    }

    return result
  })

  return {
    matches: orderedMatches,
    windowComparison,
    buckets,
    insights,
    economyStanding,
    chartMap
  }
}

export type SelfImprovementAnalysis = ReturnType<typeof useSelfImprovementAnalysis>
