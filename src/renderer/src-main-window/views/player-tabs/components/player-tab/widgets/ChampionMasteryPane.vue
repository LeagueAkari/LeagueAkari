<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5" v-if="shouldRender">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="text-base font-bold text-gray-900 dark:text-white">
        {{ t('PlayerTab.championMastery.title') }}
      </div>
      <div>
        <NButton
          v-if="masteries.length"
          secondary
          size="tiny"
          :focusable="false"
          @click="isShowingAllModal = true"
        >
          {{ t('PlayerTab.championMastery.viewAll') }}
        </NButton>
      </div>
    </div>

    <div class="mb-2 text-xs text-gray-500 dark:text-gray-400" v-if="championMastery">
      {{ t('PlayerTab.championMastery.score', { score: championMastery.score }) }}
    </div>

    <div class="flex flex-col gap-2" v-if="isLoading">
      <div class="flex items-center gap-2" v-for="i of CHAMPION_MASTERY_SKELETON_COUNT" :key="i">
        <NSkeleton :sharp="false" circle :width="28" :height="28" />
        <div class="flex-1">
          <NSkeleton :sharp="false" text :height="14" />
          <NSkeleton :sharp="false" text :height="12" :width="80" />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2" v-else>
      <NPopover
        v-for="mastery of masteries"
        :key="mastery.championId"
        :delay="50"
        :keep-alive-on-hover="false"
      >
        <template #trigger>
          <div
            class="grid cursor-default grid-cols-[28px_minmax(0,1fr)_76px] items-center gap-2 rounded-sm"
          >
            <ChampionIcon class="h-7 w-7 shrink-0 rounded" :champion-id="mastery.championId" />
            <div class="min-w-0">
              <div class="truncate text-xs font-bold text-gray-900 dark:text-white">
                {{ championName(mastery.championId) }}
              </div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400">
                {{ t('PlayerTab.championMastery.level', { level: mastery.championLevel }) }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-gray-500 dark:text-gray-400">
                {{ t('PlayerTab.championMastery.pointsLabel') }}
              </div>
              <div class="text-[11px] text-gray-700 tabular-nums dark:text-gray-200">
                {{ formatExtremeNumber(mastery.championPoints) }}
              </div>
            </div>
          </div>
        </template>

        <div class="min-w-42 text-xs">
          <div class="mb-2 flex items-center gap-2">
            <ChampionIcon class="h-6 w-6 rounded" :champion-id="mastery.championId" />
            <div class="text-xs font-bold text-black/80 dark:text-white/80">
              {{ championName(mastery.championId) }}
            </div>
          </div>
          <div class="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
            <div class="text-black/60 dark:text-white/60">
              {{ t('PlayerTab.championMastery.levelLabel') }}
            </div>
            <div class="text-right text-black/85 dark:text-white/85">
              {{ t('PlayerTab.championMastery.level', { level: mastery.championLevel }) }}
            </div>

            <div class="text-black/60 dark:text-white/60">
              {{ t('PlayerTab.championMastery.pointsLabel') }}
            </div>
            <div class="text-right text-black/85 tabular-nums dark:text-white/85">
              {{ formatExtremeNumber(mastery.championPoints) }}
            </div>

            <template v-if="mastery.highestGrade">
              <div class="text-black/60 dark:text-white/60">
                {{ t('PlayerTab.championMastery.highestGradeLabel') }}
              </div>
              <div class="text-right text-black/85 dark:text-white/85">
                {{ mastery.highestGrade }}
              </div>
            </template>

            <template v-if="mastery.championSeasonMilestone">
              <div class="text-black/60 dark:text-white/60">
                {{ t('PlayerTab.championMastery.seasonMilestoneLabel') }}
              </div>
              <div class="text-right text-black/85 tabular-nums dark:text-white/85">
                {{ mastery.championSeasonMilestone }}
              </div>
            </template>

            <template v-if="mastery.lastPlayTime">
              <div class="text-black/60 dark:text-white/60">
                {{ t('PlayerTab.championMastery.lastPlayTimeLabel') }}
              </div>
              <div class="text-right text-black/85 tabular-nums dark:text-white/85">
                {{ formatTime(mastery.lastPlayTime) }}
              </div>
            </template>
          </div>
        </div>
      </NPopover>
    </div>
  </div>

  <ChampionMasteryModal
    v-model:show="isShowingAllModal"
    :puuid="puuid"
    :score="championMastery?.score"
  />
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NPopover, NSkeleton } from 'naive-ui'
import { computed, ref } from 'vue'

import { CHAMPION_MASTERY_SKELETON_COUNT } from '../constants'
import { usePlayerTab } from '../context'
import { useChampionMastery } from '../data/champion-mastery'
import ChampionMasteryModal from './ChampionMasteryModal.vue'

const { t } = useTranslation()
const lcs = useLeagueClientStore()
const { isCrossRegion, puuid } = usePlayerTab()
const { championMastery, isLoading } = useChampionMastery()
const { formatExtremeNumber } = useNumberFormatter()

const isShowingAllModal = ref(false)

const masteries = computed(() => championMastery.value?.masteries ?? [])

const shouldRender = computed(() => {
  return !isCrossRegion.value && (isLoading.value || masteries.value.length > 0)
})

const championName = (championId: number) => {
  return lcs.gameData.champions[championId]?.name || championId.toString()
}

const formatTime = (value: number) => dayjs(value).format('YYYY-MM-DD')
</script>
