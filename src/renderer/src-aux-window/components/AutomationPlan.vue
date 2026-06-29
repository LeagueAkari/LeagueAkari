<template>
  <NCard size="small" v-if="hasDelayedItems">
    <div v-if="as2.delayedPick" class="flex flex-col gap-1 not-last:mb-1">
      <div class="text-sm font-bold text-black/90 dark:text-white">
        {{ t('auxWindow.automationPlan.autoPick.title') }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <span class="text-xs text-black/90 dark:text-white">{{
            t('auxWindow.automationPlan.autoPick.willPick')
          }}</span>
          <div class="flex items-center gap-1">
            <ChampionIcon class="h-4 w-4" :champion-id="as2.delayedPick.championId" />
            <div class="text-xs font-bold text-black dark:text-white">
              {{ championName(as2.delayedPick.championId) }}
            </div>
            <div class="text-xs text-black/90 dark:text-white">
              {{ formatMsToSeconds(pickCountdown) }}s
            </div>
          </div>
        </div>
      </div>
      <NProgress :height="2" :show-indicator="false" :percentage="pickProgress * 100" />
    </div>

    <div v-if="as2.delayedBan" class="flex flex-col gap-1 not-last:mb-1">
      <div class="text-sm font-bold text-black/90 dark:text-white">
        {{ t('auxWindow.automationPlan.autoBan.title') }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <span class="text-xs text-black/90 dark:text-white">{{
            t('auxWindow.automationPlan.autoBan.willBan')
          }}</span>
          <div class="flex items-center gap-1">
            <ChampionIcon class="h-4 w-4" :champion-id="as2.delayedBan.championId" />
            <div class="text-xs font-bold text-black dark:text-white">
              {{ championName(as2.delayedBan.championId) }}
            </div>
            <div class="text-xs text-black/90 dark:text-white">
              {{ formatMsToSeconds(banCountdown) }}s
            </div>
          </div>
        </div>
      </div>
      <NProgress :height="2" :show-indicator="false" :percentage="banProgress * 100" />
    </div>

    <div v-if="as2.delayedBenchSwap" class="flex flex-col gap-1 not-last:mb-1">
      <div class="text-sm font-bold text-black/90 dark:text-white">
        {{ t('auxWindow.automationPlan.autoBenchSwap.title') }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <span class="text-xs text-black/90 dark:text-white">{{
            t('auxWindow.automationPlan.autoBenchSwap.willSwap')
          }}</span>
          <div class="flex items-center gap-1">
            <ChampionIcon class="h-4 w-4" :champion-id="as2.delayedBenchSwap.championId" />
            <div class="text-xs font-bold text-black dark:text-white">
              {{ championName(as2.delayedBenchSwap.championId) }}
            </div>
            <div class="text-xs text-black/90 dark:text-white">
              {{ formatMsToSeconds(benchSwapCountdown) }}s
            </div>
          </div>
        </div>
      </div>
      <NProgress
        :height="2"
        :border-radius="0"
        :show-indicator="false"
        :percentage="benchSwapProgress * 100"
      />
    </div>

    <div v-if="as2.delayedChampionSwap" class="flex flex-col gap-1 not-last:mb-1">
      <div class="text-sm font-bold text-black/90 dark:text-white">
        {{ t('auxWindow.automationPlan.autoChampionSwap.title') }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <span class="text-xs text-black/90 dark:text-white">{{
            t('auxWindow.automationPlan.autoChampionSwap.willAccept')
          }}</span>
          <div class="flex items-center gap-1">
            <ChampionIcon
              class="h-4 w-4"
              :champion-id="as2.delayedChampionSwap.requesterChampionId"
            />
            <div class="text-xs font-bold text-black dark:text-white">
              {{ championName(as2.delayedChampionSwap.requesterChampionId) }}
            </div>
            <div class="text-xs text-black/90 dark:text-white">
              {{ formatMsToSeconds(championSwapCountdown) }}s
            </div>
          </div>
        </div>
      </div>
      <NProgress
        :height="2"
        :border-radius="0"
        :show-indicator="false"
        :percentage="championSwapProgress * 100"
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/composables/useChampionInfo'
import { useTimeLeft } from '@renderer-shared/composables/useTimeLeft'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NProgress } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const as2 = useAutoSelectStore()

const { name: championName } = useChampionInfo()

const { timeLeft: pickCountdown, progress: pickProgress } = useTimeLeft(
  () => as2.delayedPick?.finishAt ?? 0,
  () => as2.delayedPick?.startAt ?? 0
)

const { timeLeft: banCountdown, progress: banProgress } = useTimeLeft(
  () => as2.delayedBan?.finishAt ?? 0,
  () => as2.delayedBan?.startAt ?? 0
)

const { timeLeft: benchSwapCountdown, progress: benchSwapProgress } = useTimeLeft(
  () => as2.delayedBenchSwap?.finishAt ?? 0,
  () => as2.delayedBenchSwap?.startAt ?? 0
)

const { timeLeft: championSwapCountdown, progress: championSwapProgress } = useTimeLeft(
  () => as2.delayedChampionSwap?.finishAt ?? 0,
  () => as2.delayedChampionSwap?.startAt ?? 0
)

const hasDelayedItems = computed(() =>
  Boolean(as2.delayedPick || as2.delayedBan || as2.delayedBenchSwap || as2.delayedChampionSwap)
)

const formatMsToSeconds = (ms: number) => {
  const seconds = (ms / 1000).toFixed(1)
  return seconds
}
</script>

<style scoped></style>
