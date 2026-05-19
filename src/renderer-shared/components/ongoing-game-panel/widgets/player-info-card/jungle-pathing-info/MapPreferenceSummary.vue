<template>
  <div>
    <div class="mb-1 font-bold text-black/90 dark:text-white/90">
      {{ t('JunglePathing.mapPref') }}
    </div>
    <div class="flex flex-col gap-1 text-[11px]">
      <div class="flex items-center gap-1.5 text-black/80 dark:text-white/80">
        <span class="text-black/85 dark:text-white/90">{{
          t('JunglePathing.gamesAnalyzed', { count: stats.gamesAnalyzed })
        }}</span>
        <span class="text-black/35 dark:text-white/35">·</span>
        <span class="whitespace-nowrap" :class="topsideTextColor(stats)">{{
          topsideTextWithPct(t, stats)
        }}</span>
      </div>

      <div class="flex items-baseline gap-2 text-black/75 dark:text-white/75">
        <span class="shrink-0 text-black/45 dark:text-white/45">{{
          t('JunglePathing.zoneWeight')
        }}</span>
        <span class="inline-flex gap-2 whitespace-nowrap">
          <span class="inline-flex items-baseline gap-1">
            <span class="text-red-600 dark:text-red-400">{{ t('JunglePathing.topShort') }}</span>
            <span>{{ formatWeightSum(stats.topZoneWeightSum) }}</span>
          </span>
          <span class="text-black/25 dark:text-white/25">|</span>
          <span class="inline-flex items-baseline gap-1">
            <span class="text-amber-600 dark:text-yellow-400">{{
              t('JunglePathing.midShort')
            }}</span>
            <span>{{ formatWeightSum(stats.midZoneWeightSum) }}</span>
          </span>
          <span class="text-black/25 dark:text-white/25">|</span>
          <span class="inline-flex items-baseline gap-1">
            <span class="text-blue-600 dark:text-blue-400">{{ t('JunglePathing.botShort') }}</span>
            <span>{{ formatWeightSum(stats.botZoneWeightSum) }}</span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'
import { useTranslation } from 'i18next-vue'

import { formatWeightSum, topsideTextColor, topsideTextWithPct } from './preference'

defineProps<{
  stats: AggregatedJungleAnalysis
}>()

const { t } = useTranslation()
</script>
