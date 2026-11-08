import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { computed, watch } from 'vue'

import type { SelfImprovementChartView } from '../components/types'
import {
  SELF_IMPROVEMENT_BUCKET_SIZE,
  SELF_IMPROVEMENT_RECENT_WINDOW,
  type SelfImprovementMetricKey,
  buildSelfImprovementBuckets,
  buildSelfImprovementMovingAverage,
  compareRecentSelfImprovementMatches,
  getSelfImprovementMetricValue,
  summarizeSelfImprovementMatches
} from '../data/self-improvement-metrics'
import {
  SELF_IMPROVEMENT_MATCH_COUNT_OPTIONS,
  useSelfImprovementData
} from './useSelfImprovementData'

interface SelfImprovementChartConfig {
  key: SelfImprovementMetricKey
  title: string
  unit: string
  color: string
  precision?: number
  percent?: boolean
}

const POSITION_ORDER = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

const positionTextKeys: Record<string, string> = {
  TOP: 'selfImprovement.positions.TOP',
  JUNGLE: 'selfImprovement.positions.JUNGLE',
  MIDDLE: 'selfImprovement.positions.MIDDLE',
  BOTTOM: 'selfImprovement.positions.BOTTOM',
  UTILITY: 'selfImprovement.positions.UTILITY'
}

/**
 * 自我提升页面的共享状态
 *
 * 页面只加载一次数据，各分类页通过 context 共享，切换分类不会重新请求。
 */
export function useSelfImprovementPage() {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()

  const data = useSelfImprovementData()

  const me = computed(() => lcs.summoner.me)

  const playerName = computed(() => {
    const summoner = me.value
    if (!summoner) {
      return ''
    }

    if (summoner.gameName && summoner.tagLine) {
      return `${summoner.gameName}#${summoner.tagLine}`
    }

    return summoner.displayName || summoner.gameName || summoner.internalName
  })

  const matchCountOptions = computed(() =>
    SELF_IMPROVEMENT_MATCH_COUNT_OPTIONS.map((count) => ({
      label: t('selfImprovement.controls.matchCountOption', { count }),
      value: count
    }))
  )

  const updatedAtText = computed(() => {
    if (!data.lastLoadedAt.value) {
      return ''
    }

    return dayjs(data.lastLoadedAt.value).format('HH:mm:ss')
  })

  const loadingText = computed(() => {
    if (data.loadProgress.value) {
      return t('selfImprovement.loadingProgress', {
        loaded: data.loadProgress.value.loaded,
        total: data.loadProgress.value.total
      })
    }

    return t('selfImprovement.loading')
  })

  const selectedPosition = data.selectedPosition
  const handlePositionUpdate = data.handlePositionUpdate

  const positionOptions = computed(() =>
    POSITION_ORDER.filter((position) => data.availablePositions.value.includes(position)).map(
      (position) => ({
        value: position,
        label: t(positionTextKeys[position])
      })
    )
  )

  watch(positionOptions, (options) => {
    if (
      selectedPosition.value &&
      !options.some((option) => option.value === selectedPosition.value)
    ) {
      selectedPosition.value = null
    }
  })

  const visibleMatches = computed(() => data.matches.value)

  const windowComparison = computed(() =>
    compareRecentSelfImprovementMatches(visibleMatches.value, SELF_IMPROVEMENT_RECENT_WINDOW)
  )

  const overallSummary = computed(() => summarizeSelfImprovementMatches(visibleMatches.value))

  const buckets = computed(() =>
    buildSelfImprovementBuckets(visibleMatches.value, SELF_IMPROVEMENT_BUCKET_SIZE)
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

  const averageOf = (getter: (match: (typeof visibleMatches.value)[number]) => number) => {
    if (visibleMatches.value.length === 0) {
      return 0
    }

    return (
      visibleMatches.value.reduce((acc, match) => acc + getter(match), 0) /
      visibleMatches.value.length
    )
  }

  const chartMap = computed(() => {
    const totalDamage = visibleMatches.value.reduce(
      (acc, match) => acc + match.damageToChampions,
      0
    )
    const totalGold = visibleMatches.value.reduce((acc, match) => acc + match.gold, 0)
    const totalTeamDamage = visibleMatches.value.reduce(
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
      const points = visibleMatches.value.map((match) => {
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
    ...data,
    me,
    playerName,
    matchCountOptions,
    updatedAtText,
    loadingText,
    selectedPosition,
    positionOptions,
    handlePositionUpdate,
    visibleMatches,
    windowComparison,
    buckets,
    chartMap
  }
}

export type SelfImprovementPageContext = ReturnType<typeof useSelfImprovementPage>
