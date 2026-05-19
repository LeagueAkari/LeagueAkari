<template>
  <JunglePathingSection>
    <template #map>
      <GankMap
        :position-points="stats.minutePositions"
        :kill-points="stats.gankPositions"
        :size="140"
        :position-limit="54"
        :kill-limit="100"
        balance-by-lane
        show-side-fill
        position-dot-size-class="h-1 w-1"
        kill-marker-size-class="h-3 w-3"
      />
      <div class="flex flex-col gap-1 pl-0.5 text-[10px] text-black/55 dark:text-white/55">
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          <span class="grid w-7.5 grid-cols-3 place-items-center">
            <svg
              class="h-2 w-2 text-red-600 dark:text-red-400"
              viewBox="0 0 8 8"
              aria-hidden="true"
            >
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </svg>
            <svg
              class="h-2 w-2 text-amber-500 dark:text-yellow-400"
              viewBox="0 0 8 8"
              aria-hidden="true"
            >
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </svg>
            <svg
              class="h-2 w-2 text-blue-600 dark:text-blue-400"
              viewBox="0 0 8 8"
              aria-hidden="true"
            >
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </svg>
          </span>
          {{ t('JunglePathing.minuteLegend') }}
        </span>
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          <span class="grid w-7.5 grid-cols-3 place-items-center">
            <span v-for="lane of lanes" :key="lane" class="relative h-2.5 w-2.5">
              <span
                class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm"
                :class="laneCrossColors[lane]"
              />
              <span
                class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm"
                :class="laneCrossColors[lane]"
              />
            </span>
          </span>
          {{ t('JunglePathing.gankLegend') }}
        </span>
        <NPopover :delay="50" :keep-alive-on-hover="false" :show-arrow="false">
          <template #trigger>
            <span
              class="inline-flex w-fit cursor-help items-center gap-1 text-[10px] leading-4 text-black/40 transition-colors hover:text-black/55 dark:text-white/40 dark:hover:text-white/55"
            >
              <span class="rounded border border-current/25 px-1 leading-3" aria-hidden="true"
                >?</span
              >
              {{ t('JunglePathing.mapSemanticHint') }}
            </span>
          </template>

          <div class="max-w-64 text-xs leading-relaxed text-black/65 dark:text-white/65">
            {{ t('JunglePathing.mapSemanticDescription') }}
          </div>
        </NPopover>
      </div>
    </template>

    <template #content>
      <MapPreferenceSummary :stats="stats" />
      <ObjectivesSummary :stats="stats" />
    </template>
  </JunglePathingSection>
</template>

<script setup lang="ts">
import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'

import GankMap from './GankMap.vue'
import JunglePathingSection from './JunglePathingSection.vue'
import MapPreferenceSummary from './MapPreferenceSummary.vue'
import ObjectivesSummary from './ObjectivesSummary.vue'

defineProps<{
  stats: AggregatedJungleAnalysis
}>()

const { t } = useTranslation()

const lanes = ['top', 'mid', 'bot'] as const
const laneCrossColors = {
  top: 'bg-red-600 dark:bg-red-400',
  mid: 'bg-amber-500 dark:bg-yellow-400',
  bot: 'bg-blue-600 dark:bg-blue-400'
}
</script>
