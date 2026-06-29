<template>
  <div class="flex w-full flex-col">
    <div class="mb-2 text-center text-xs font-bold text-black/70 dark:text-white/70">
      {{ t('playerTabs.matchHistory.filters.examples.title') }}
    </div>

    <div
      class="example-preset mb-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded px-1 text-center text-xs leading-5 text-black/70 transition-colors hover:bg-black/4 hover:text-black/80 dark:text-white/60 dark:hover:bg-white/4 hover:dark:text-white/80"
      role="button"
      tabindex="0"
      @click="handleApplyCleanMatchSamplesPreset"
      @keydown.enter="handleApplyCleanMatchSamplesPreset"
      @keydown.space.prevent="handleApplyCleanMatchSamplesPreset"
    >
      <NIcon class="flex shrink-0 items-center text-sm text-teal-600 dark:text-teal-300">
        <ChevronRight20Regular />
      </NIcon>

      <span
        class="example-text inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5"
      >
        <TranslationComponent
          :translation="t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.title')"
        >
          <template #matched>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-teal-700 dark:text-teal-300"
            >
              <NIcon class="shrink-0 text-base"><CheckmarkCircle20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.matched')
              }}</span>
            </span>
          </template>

          <template #remake>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-sky-700 dark:text-sky-300"
            >
              <NIcon class="shrink-0 text-base"><ArrowReset20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.remake')
              }}</span>
            </span>
          </template>

          <template #abort>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-rose-700 dark:text-rose-300"
            >
              <NIcon class="shrink-0 text-base"><DismissCircle20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.abort')
              }}</span>
            </span>
          </template>

          <template #pve>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-purple-700 dark:text-purple-300"
            >
              <NIcon class="shrink-0 text-base"><Bot20Regular /></NIcon>
              <span>{{ t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.pve') }}</span>
            </span>
          </template>

          <template #duration>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-amber-700 dark:text-amber-300"
            >
              <NIcon class="shrink-0 text-base"><Timer20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.cleanMatchSamples.duration')
              }}</span>
            </span>
          </template>
        </TranslationComponent>
      </span>
    </div>

    <div
      class="example-preset mb-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded px-1 text-center text-xs leading-5 text-black/70 transition-colors hover:bg-black/4 hover:text-black/80 dark:text-white/60 dark:hover:bg-white/4 hover:dark:text-white/80"
      role="button"
      tabindex="0"
      @click="handleApplyKiwiJayceSlowAndSteadyPreset"
      @keydown.enter="handleApplyKiwiJayceSlowAndSteadyPreset"
      @keydown.space.prevent="handleApplyKiwiJayceSlowAndSteadyPreset"
    >
      <NIcon class="flex shrink-0 items-center text-sm text-teal-600 dark:text-teal-300">
        <ChevronRight20Regular />
      </NIcon>

      <span
        class="example-text inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5"
      >
        <TranslationComponent
          :translation="t('playerTabs.matchHistory.filters.examples.kiwiJayceSlowAndSteady.title')"
        >
          <template #queue>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-teal-700 dark:text-teal-300"
            >
              <LcuImage
                v-if="kiwiGameModeIconUri"
                class="size-4 shrink-0"
                :src="kiwiGameModeIconUri"
              />
              <span>{{ kiwiJayceSlowAndSteadyAssetNames.queue }}</span>
            </span>
          </template>

          <template #champion>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-sky-700 dark:text-sky-300"
            >
              <ChampionIcon
                class="size-4 shrink-0 rounded-sm"
                :champion-id="kiwiJayceSlowAndSteadyAssets.championId"
              />
              <span>{{ kiwiJayceSlowAndSteadyAssetNames.champion }}</span>
            </span>
          </template>

          <template #augment>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-amber-700 dark:text-amber-300"
            >
              <AugmentDisplay
                class="shrink-0"
                :size="16"
                :augment-id="kiwiJayceSlowAndSteadyAssets.augmentId"
              />
              <span>{{ kiwiJayceSlowAndSteadyAssetNames.augment }}</span>
            </span>
          </template>
        </TranslationComponent>
      </span>
    </div>

    <div
      class="example-preset mb-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded px-1 text-center text-xs leading-5 text-black/70 transition-colors hover:bg-black/4 hover:text-black/80 dark:text-white/60 dark:hover:bg-white/4 hover:dark:text-white/80"
      role="button"
      tabindex="0"
      @click="handleApplyStrongSelfPerformancePreset"
      @keydown.enter="handleApplyStrongSelfPerformancePreset"
      @keydown.space.prevent="handleApplyStrongSelfPerformancePreset"
    >
      <NIcon class="flex shrink-0 items-center text-sm text-teal-600 dark:text-teal-300">
        <ChevronRight20Regular />
      </NIcon>

      <span
        class="example-text inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5"
      >
        <TranslationComponent
          :translation="t('playerTabs.matchHistory.filters.examples.strongSelfPerformance.title')"
        >
          <template #kda>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-teal-700 dark:text-teal-300"
            >
              <NIcon class="shrink-0 text-base"><Star20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.strongSelfPerformance.kda')
              }}</span>
            </span>
          </template>

          <template #deaths>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-rose-700 dark:text-rose-300"
            >
              <NIcon class="shrink-0 text-base"><DismissCircle20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.strongSelfPerformance.deaths')
              }}</span>
            </span>
          </template>

          <template #contribution>
            <span
              class="inline-flex items-center gap-1 align-middle font-bold text-amber-700 dark:text-amber-300"
            >
              <NIcon class="shrink-0 text-base"><Target20Regular /></NIcon>
              <span>{{
                t('playerTabs.matchHistory.filters.examples.strongSelfPerformance.contribution')
              }}</span>
            </span>
          </template>
        </TranslationComponent>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  ArrowReset20Regular,
  Bot20Regular,
  CheckmarkCircle20Regular,
  ChevronRight20Regular,
  DismissCircle20Regular,
  Star20Regular,
  Target20Regular,
  Timer20Regular
} from '@vicons/fluent'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMapAssets } from '@main-window/composables/useMapAssets'

import { usePlayerTab } from '../../../context'
import { useMatchHistoryFilterEditor } from '../context'
import {
  MATCH_HISTORY_FILTER_PRESET_ASSETS,
  createCleanMatchSamplesPreset,
  createKiwiJayceSlowAndSteadyPreset,
  createStrongSelfPerformancePreset
} from './filter-presets'

const { t } = useTranslation()
const lcs = useLeagueClientStore()
const mapAssets = useMapAssets()
const { puuid } = usePlayerTab()
const { cachedSummoners, setState } = useMatchHistoryFilterEditor()

const kiwiJayceSlowAndSteadyAssets = MATCH_HISTORY_FILTER_PRESET_ASSETS.kiwiJayceSlowAndSteady

const kiwiJayceSlowAndSteadyAssetNames = computed(() => {
  const { queueId, championId, augmentId } = kiwiJayceSlowAndSteadyAssets

  return {
    queue: lcs.gameData.queueName(queueId),
    champion: lcs.gameData.championName(championId),
    augment: lcs.gameData.augmentName(augmentId)
  }
})

const kiwiGameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return null
  }

  const mapAsset = Object.values(mapAssets.value)
    .flat()
    .find((item) => item.gameMode === 'KIWI')

  return mapAsset?.assets?.['game-select-icon-hover'] ?? null
})

const handleApplyCleanMatchSamplesPreset = () => {
  setState(createCleanMatchSamplesPreset(cachedSummoners.value))
}

const handleApplyStrongSelfPerformancePreset = () => {
  setState(createStrongSelfPerformancePreset(puuid.value, cachedSummoners.value))
}

const handleApplyKiwiJayceSlowAndSteadyPreset = () => {
  setState(createKiwiJayceSlowAndSteadyPreset(puuid.value, cachedSummoners.value))
}
</script>

<style scoped>
.example-text :deep(span) {
  display: inline-flex;
  align-items: center;
}

.example-preset :deep(.champion-icon-container),
.example-preset :deep(.augment),
.example-preset :deep(img) {
  vertical-align: middle;
}

.example-preset:focus {
  outline: none;
}

.example-preset:focus-visible {
  background-color: rgb(0 0 0 / 0.04);
  color: rgb(0 0 0 / 0.8);
}

[data-theme='dark'] .example-preset:focus-visible {
  background-color: rgb(255 255 255 / 0.04);
  color: rgb(255 255 255 / 0.8);
}
</style>
