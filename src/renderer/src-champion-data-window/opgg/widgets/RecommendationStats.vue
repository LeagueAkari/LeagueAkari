<template>
  <StatisticPopover
    :metric="pickRateMetric"
    :value="(record.pickRate * 100).toFixed(2) + '%'"
    :play="record.play"
  >
    <StatisticValue :inline="inline" :label="t(`opgg.statistics.${pickRateMetric}.label`)">
      {{ (record.pickRate * 100).toFixed(2) }}%
      <template #caption>
        {{ t('opgg.champion.times', { times: record.play.toLocaleString() }) }}
      </template>
    </StatisticValue>
  </StatisticPopover>

  <StatisticPopover
    metric="winRate"
    :value="formatWinRate(record.winRate)"
    :play="record.play"
    :record="record"
  >
    <StatisticValue
      :inline="inline"
      :label="t('opgg.statistics.winRate.label')"
      :color="getWinRateColor(record.winRate)"
    >
      {{ formatWinRate(record.winRate) }}
    </StatisticValue>
  </StatisticPopover>
</template>

<script setup lang="ts">
import StatisticValue from '@champion-data-window/components/champion-statistics/StatisticValue.vue'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import type { OpggRecommendationStats } from '@shared/types/champion-data/opgg'
import { useTranslation } from 'i18next-vue'

import StatisticPopover from './StatisticPopover.vue'

const { pickRateMetric = 'pickRate' } = defineProps<{
  record: OpggRecommendationStats
  inline?: boolean
  pickRateMetric?: 'pickRate' | 'synergyPickRate'
}>()

const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()
</script>
