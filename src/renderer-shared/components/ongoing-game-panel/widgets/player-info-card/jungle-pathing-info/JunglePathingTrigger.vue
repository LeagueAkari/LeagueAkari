<template>
  <div
    class="flex w-full cursor-pointer items-center gap-2 rounded border border-indigo-500/60 bg-indigo-500/8 px-2 py-1 transition-[filter] hover:brightness-110 dark:border-indigo-300/56 dark:bg-indigo-300/8"
  >
    <div class="shrink-0">
      <GankMap
        v-if="stats"
        :position-points="stats.minutePositions"
        :kill-points="stats.gankPositions"
        :size="48"
        heatmap
        :heatmap-grid-size="7"
        :heatmap-cell-limit="14"
      />
      <div
        v-else
        class="flex size-12 shrink-0 items-center justify-center rounded bg-black/10 text-[10px] text-black/35 dark:bg-white/10 dark:text-white/35"
      >
        {{ t('JunglePathing.noDataShort') }}
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1 text-[11px]">
      <div v-if="stats" class="flex min-w-0 items-center gap-1.5 text-black/80 dark:text-white/80">
        <ChampionIcon
          v-if="championId != null"
          :champion-id="championId"
          class="size-4 shrink-0 rounded-full"
        />
        <span class="shrink-0 font-semibold text-indigo-900/75 dark:text-indigo-100/80">{{
          t('JunglePathing.gamesAnalyzed', { count: stats.gamesAnalyzed })
        }}</span>
        <span class="shrink-0 text-black/35 dark:text-white/35">·</span>
        <span class="min-w-0 truncate whitespace-nowrap" :class="topsideTextColor(stats)">{{
          topsideTextTrigger(t, stats)
        }}</span>
      </div>
      <div v-else class="text-black/50 dark:text-white/50">
        {{ placeholderText }}
      </div>

      <div v-if="stats" class="flex min-w-0 text-black/75 dark:text-white/75">
        <span class="inline-flex min-w-0 gap-1.5 whitespace-nowrap">
          <span class="inline-flex items-baseline gap-1">
            <span class="text-red-600 dark:text-red-400">{{
              t('JunglePathing.zoneTiny.top')
            }}</span>
            <span>{{ formatWeightSum(stats.topZoneWeightSum) }}</span>
          </span>
          <span class="text-black/25 dark:text-white/25">|</span>
          <span class="inline-flex items-baseline gap-1">
            <span class="text-amber-600 dark:text-yellow-400">{{
              t('JunglePathing.zoneTiny.mid')
            }}</span>
            <span>{{ formatWeightSum(stats.midZoneWeightSum) }}</span>
          </span>
          <span class="text-black/25 dark:text-white/25">|</span>
          <span class="inline-flex items-baseline gap-1">
            <span class="text-blue-600 dark:text-blue-400">{{
              t('JunglePathing.zoneTiny.bot')
            }}</span>
            <span>{{ formatWeightSum(stats.botZoneWeightSum) }}</span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'
import { useTranslation } from 'i18next-vue'

import { formatWeightSum, topsideTextColor, topsideTextTrigger } from './preference'
import GankMap from './GankMap.vue'

defineProps<{
  stats: AggregatedJungleAnalysis | null
  championId: number | null
  placeholderText: string
}>()

const { t } = useTranslation()
</script>
