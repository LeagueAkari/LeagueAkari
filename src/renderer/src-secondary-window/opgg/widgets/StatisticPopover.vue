<template>
  <NPopover trigger="hover" :delay="1000" :keep-alive-on-hover="false">
    <template #trigger>
      <slot />
    </template>

    <div class="max-w-64 text-xs">
      <div class="mb-1 flex items-baseline justify-between gap-6 font-bold">
        <span>{{ t(`opgg.statistics.${metric}.label`) }}</span>
        <span class="tabular-nums">{{ value }}</span>
      </div>
      <div
        v-if="metric === 'performance' || metric === 'popular'"
        class="text-black/65 dark:text-white/65"
      >
        {{ t(`opgg.statistics.${metric}.description`) }}
      </div>

      <div v-if="play != null" class="mt-2 flex justify-between gap-6">
        <span>{{ t('opgg.statistics.plays.label') }}</span>
        <span class="tabular-nums">{{ play.toLocaleString() }}</span>
      </div>
      <template v-if="record && record.win !== null && record.loss !== null">
        <div class="flex justify-between gap-6">
          <span>{{ t('opgg.statistics.wins') }}</span>
          <span class="tabular-nums">{{ record.win.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between gap-6">
          <span>{{ t('opgg.statistics.losses') }}</span>
          <span class="tabular-nums">{{ record.loss.toLocaleString() }}</span>
        </div>
      </template>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import type { OpggChampionDataRow } from '@shared/types/champion-data/opgg'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'

defineProps<{
  metric:
    | 'winRate'
    | 'matchupWinRate'
    | 'pickRate'
    | 'championPickRate'
    | 'synergyPickRate'
    | 'banRate'
    | 'plays'
    | 'averagePlace'
    | 'firstPlaceRate'
    | 'performance'
    | 'popular'
  value: string | number
  play?: number | null
  record?: Pick<OpggChampionDataRow, 'win' | 'loss'>
}>()

const { t } = useTranslation()
</script>
