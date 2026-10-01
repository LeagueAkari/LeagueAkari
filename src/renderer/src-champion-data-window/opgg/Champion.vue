<template>
  <div class="relative h-full">
    <NScrollbar v-if="championId" content-class="flex min-h-full flex-col">
      <div class="relative isolate flex flex-1 flex-col overflow-hidden">
        <LcuImage
          v-if="splashPath"
          :key="splashPath"
          :src="splashPath"
          class="champion-header-art"
          :class="{ 'is-loaded': splashLoaded }"
          aria-hidden="true"
          @load="splashLoaded = true"
        />

        <div v-if="champion" v-show="!isLoading" class="champion-content flex flex-col gap-4">
          <!-- summary -->
          <div class="champion-header">
            <div class="relative flex min-w-0 flex-1 items-center gap-3 self-start">
              <ChampionIcon
                round
                class="size-14 shrink-0 ring-2"
                :champion-id="championId"
                :style="{ '--tw-ring-color': getTierColors(stats?.tier).color }"
              />

              <!-- 名字 / 梯队 / 位置 -->
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-1">
                  <span class="min-w-0 text-xl leading-7 font-bold wrap-break-word">
                    {{ resources.champions.name(championId) }}
                  </span>
                  <TierBadge
                    class="relative top-0.5"
                    v-if="stats && stats.tier !== null"
                    :tier="stats.tier"
                  />
                </div>
                <div
                  v-if="mode === 'ranked'"
                  class="mt-1 flex items-center gap-1 text-[13px] text-black/80 dark:text-white/80"
                >
                  <PositionIcon :position="position" class="shrink-0 text-sm" aria-hidden="true" />
                  <span>{{ t(`opgg.filters.positions.${position}`) || position }}</span>
                </div>
              </div>
            </div>

            <!-- stats -->
            <div v-if="stats" class="champion-header-stats">
              <!-- cherry 平均排名 -->
              <StatisticPopover
                v-if="stats.averagePlace != null"
                metric="averagePlace"
                :value="stats.averagePlace.toFixed(2)"
                :play="stats.play"
              >
                <div class="min-w-16">
                  <div
                    class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65"
                  >
                    {{ t('opgg.champion.avgPlace') }}
                  </div>
                  <div class="text-sm leading-5 font-bold tabular-nums">
                    {{ stats.averagePlace.toFixed(2) }}
                  </div>
                </div>
              </StatisticPopover>

              <!-- cherry 吃鸡率 -->
              <StatisticPopover
                v-if="stats.firstPlaceRate != null"
                metric="firstPlaceRate"
                :value="(stats.firstPlaceRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <div class="min-w-16">
                  <div
                    class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65"
                  >
                    {{ t('opgg.champion.1st') }}
                  </div>
                  <div class="text-sm leading-5 font-bold tabular-nums">
                    {{ (stats.firstPlaceRate * 100).toFixed(2) }}%
                  </div>
                </div>
              </StatisticPopover>

              <!-- 胜率 1 -->
              <StatisticPopover
                v-if="typeof stats.winRate === 'number'"
                metric="winRate"
                :value="(stats.winRate * 100).toFixed(2) + '%'"
                :play="stats.play"
                :record="stats"
              >
                <div class="min-w-16">
                  <div
                    class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65"
                  >
                    {{ t('opgg.champion.winRate') }}
                  </div>
                  <div
                    class="text-sm leading-5 font-bold tabular-nums"
                    :style="{ color: getWinRateColor(stats.winRate) }"
                  >
                    {{ (stats.winRate * 100).toFixed(2) }}%
                  </div>
                </div>
              </StatisticPopover>

              <!-- 选取率 -->
              <StatisticPopover
                v-if="stats.pickRate != null"
                metric="championPickRate"
                :value="(stats.pickRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <div class="min-w-16">
                  <div
                    class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65"
                  >
                    {{ t('opgg.champion.pickRate') }}
                  </div>
                  <div class="text-sm leading-5 font-bold tabular-nums">
                    {{ (stats.pickRate * 100).toFixed(2) }}%
                  </div>
                </div>
              </StatisticPopover>

              <!-- 禁用率 -->
              <StatisticPopover
                v-if="stats.banRate != null"
                metric="banRate"
                :value="(stats.banRate * 100).toFixed(2) + '%'"
              >
                <div class="min-w-16">
                  <div
                    class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65"
                  >
                    {{ t('opgg.champion.banRate') }}
                  </div>
                  <div class="text-sm leading-5 font-bold tabular-nums">
                    {{ (stats.banRate * 100).toFixed(2) }}%
                  </div>
                </div>
              </StatisticPopover>
            </div>
          </div>

          <div class="relative grid grid-cols-1 gap-x-3 gap-y-4 lg:grid-cols-2">
            <!-- 堆叠的艺术 -->
            <ChampionBalance />
            <ChampionCounters />
            <ChampionKiwiAugments />
            <ChampionSpells />
            <ChampionRunes />
            <ChampionSynergies />
            <ChampionAugments />
            <ChampionSkills />
            <ChampionImportItemSet />
            <ChampionStarterItems />
            <ChampionBoots />
            <ChampionPrismItems />
            <ChampionCoreItems />
            <ChampionLastItems />

            <SettingsSection v-if="isEmpty" class="col-span-full">
              <div class="px-3 py-14 text-center text-sm text-black/60 dark:text-white/60">
                {{ t('opgg.champion.empty') }}
              </div>
            </SettingsSection>
          </div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useOpgg } from './context'
import {
  useTierTheme,
  useWinRateTheme
} from '@champion-data-window/components/champion-statistics/theme'
import ChampionAugments from './widgets/ChampionAugments.vue'
import ChampionBalance from './widgets/ChampionBalance.vue'
import ChampionBoots from './widgets/ChampionBoots.vue'
import ChampionCoreItems from './widgets/ChampionCoreItems.vue'
import ChampionCounters from './widgets/ChampionCounters.vue'
import ChampionImportItemSet from './widgets/ChampionImportItemSet.vue'
import ChampionKiwiAugments from './widgets/ChampionKiwiAugments.vue'
import ChampionLastItems from './widgets/ChampionLastItems.vue'
import ChampionPrismItems from './widgets/ChampionPrismItems.vue'
import ChampionRunes from './widgets/ChampionRunes.vue'
import ChampionSkills from './widgets/ChampionSkills.vue'
import ChampionSpells from './widgets/ChampionSpells.vue'
import ChampionStarterItems from './widgets/ChampionStarterItems.vue'
import ChampionSynergies from './widgets/ChampionSynergies.vue'
import StatisticPopover from './widgets/StatisticPopover.vue'
import TierBadge from '@champion-data-window/components/champion-statistics/TierBadge.vue'

const { championId, champion, position, mode, isLoading } = useOpgg()

const { t } = useTranslation()
const { getTierColors } = useTierTheme()
const { getWinRateColor } = useWinRateTheme()

const resources = useAkariResourceProvider()

const stats = computed(() => champion.value?.summary ?? null)
const splashLoaded = ref(false)
const splashPath = computed(() => {
  if (!championId.value) {
    return null
  }

  return resources.champions.baseSplash(championId.value)
})

watch(splashPath, () => {
  splashLoaded.value = false
})

const isEmpty = computed(() => champion.value && !champion.value.hasContent)
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.champion-header {
  @apply relative col-span-full box-border flex min-h-28 min-w-0 justify-between gap-4 overflow-hidden border-b border-black/8 px-3 py-3 dark:border-white/8;
}

.champion-header-art {
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  width: min(100%, 720px);
  height: auto;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms ease-out;
  mask-image:
    linear-gradient(to right, transparent 8%, black 58%),
    linear-gradient(to bottom, black 8%, rgb(0 0 0 / 20%) 45%, transparent 90%);
  mask-composite: intersect;
}

.champion-header-art.is-loaded {
  opacity: 0.32;
}

[data-theme='dark'] .champion-header-art.is-loaded {
  opacity: 0.6;
}

.champion-header-stats {
  @apply relative flex w-54 shrink-0 flex-wrap-reverse justify-end gap-x-3 gap-y-1 self-end;
}

.champion-content {
  animation: champion-content-in 300ms ease-out;
}

@keyframes champion-content-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .champion-header-art {
    transition: none;
  }

  .champion-content {
    animation: none;
  }
}
</style>
