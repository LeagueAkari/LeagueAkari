<template>
  <div v-if="shouldRender" class="relative flex gap-4">
    <!-- Cross Region Unsupported Card -->
    <div
      v-if="isCrossRegion"
      class="relative flex h-27 flex-col items-center justify-center rounded-lg bg-black/5 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-400"
      :class="isSmallSize ? 'w-30' : 'w-60'"
    >
      <div>{{ t('RankedPane.crossRegion', 'Cross Region') }}</div>
      <div>{{ t('RankedPane.unavailable', 'Unavailable') }}</div>
    </div>

    <!-- Ranked Cards -->
    <template v-else>
      <div
        v-for="entry in displayedRankedEntries"
        :key="entry.queueType"
        class="relative flex h-27 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5 backdrop-blur-sm"
        :class="isSmallSize ? 'w-30' : 'w-72'"
      >
        <!-- Queue Type Label -->
        <div class="absolute top-0 left-0 px-2.5 py-1.5 text-[11px] font-medium text-gray-500/80 dark:text-gray-400/80">
          {{
            t(`queueTypes.${entry.queueType}`, {
              defaultValue: entry.queueType,
              ns: 'common'
            })
          }}
        </div>

        <!-- Main Content -->
        <div class="relative mt-3.5 flex w-full items-center pl-4 pr-3 gap-3">
          <!-- Image Container -->
          <div v-if="!isSmallSize" class="relative h-16 w-16 shrink-0">
            <img
              class="absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 object-contain"
              :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
              :style="{ filter: `drop-shadow(0 0 6px ${TIER_COLORS[entry.tier || 'UNRANKED']}44)` }"
            />
          </div>

          <!-- Info & Stats -->
          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <!-- Row 1: Tier & Win/Lose -->
            <div class="flex items-baseline justify-between gap-2">
              <span class="truncate text-[17px] leading-tight font-bold text-gray-900 dark:text-gray-100">{{
                formatTier(entry)
              }}</span>
              <span class="text-[11px] text-gray-500/90 dark:text-gray-400/90 whitespace-nowrap">{{ formatWinLose(entry) }}</span>
            </div>

            <!-- Row 2: LP & Win Rate -->
            <div class="flex items-baseline justify-between gap-2 mt-0.5">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight opacity-90 truncate">{{ formatRankPoints(entry) }}</span>
              <span class="text-[11px] text-gray-500/90 dark:text-gray-400/90 whitespace-nowrap">{{ t('PlayerTab.stats.wr') }} {{ formatWinRate(entry) }}</span>
            </div>

            <!-- Row 3: Highest Tier -->
            <div
              class="mt-1 flex items-center text-[10px] text-gray-500 dark:text-gray-400 min-w-0"
              :class="{
                'opacity-0': !entry.highestTier || entry.highestTier === 'NA'
              }"
            >
              <span class="mr-1 opacity-70 whitespace-nowrap">{{ t('RankedPane.highest') }}</span>
              <div class="flex items-center min-w-0">
                <img
                  v-if="
                    entry.highestTier &&
                    rankedMedalMap[entry.highestTier]
                  "
                  :src="rankedMedalMap[entry.highestTier]"
                  class="mr-0.5 h-3.5 w-3.5 shrink-0"
                />
                <span class="font-bold truncate" :style="{ color: TIER_COLORS[entry.highestTier || 'UNRANKED'] }">
                  {{ formatHighestTier(entry) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- More Button -->
      <div
        class="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/3"
        v-if="displayedRankedEntries.length > 1"
      >
        <NButton
          :focusable="false"
          :title="t('PlayerTab.rankedMore', '更多排位信息')"
          size="small"
          secondary
          @click="isShowingRankedModal = true"
        >
          <template #icon>
            <NIcon><MoreHorizFilled /></NIcon>
          </template>
        </NButton>
      </div>
    </template>
  </div>

  <NModal v-model:show="isShowingRankedModal">
    <div class="flex flex-col items-center rounded bg-neutral-100/95 p-4 dark:bg-neutral-900/95">
      <div class="mb-4 grid grid-cols-2 gap-4">
        <div
          v-for="entry in displayedRankedEntries"
          :key="entry.queueType"
          class="relative flex h-[108px] w-72 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5 backdrop-blur-sm"
        >
          <!-- Queue Type Label -->
          <div class="absolute top-0 left-0 px-2.5 py-1.5 text-[11px] font-medium text-gray-500/80 dark:text-gray-400/80">
            {{
              t(`queueTypes.${entry.queueType}`, {
                defaultValue: entry.queueType,
                ns: 'common'
              })
            }}
          </div>

          <!-- Main Content -->
          <div class="relative mt-3.5 flex w-full items-center pl-4 pr-3 gap-3">
            <!-- Image Container -->
            <div class="relative h-16 w-16 shrink-0">
              <img
                class="absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 object-contain"
                :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
                :style="{ filter: `drop-shadow(0 0 6px ${TIER_COLORS[entry.tier || 'UNRANKED']}44)` }"
              />
            </div>

            <!-- Info & Stats -->
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <!-- Row 1: Tier & Win/Lose -->
              <div class="flex items-baseline justify-between gap-2">
                <span class="truncate text-[17px] leading-tight font-bold text-gray-900 dark:text-gray-100">{{
                  formatTier(entry)
                }}</span>
                <span class="text-[11px] text-gray-500/90 dark:text-gray-400/90 whitespace-nowrap">{{ formatWinLose(entry) }}</span>
              </div>

              <!-- Row 2: LP & Win Rate -->
              <div class="flex items-baseline justify-between gap-2 mt-0.5">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight opacity-90 truncate">{{ formatRankPoints(entry) }}</span>
                <span class="text-[11px] text-gray-500/90 dark:text-gray-400/90 whitespace-nowrap">{{ t('PlayerTab.stats.wr') }} {{ formatWinRate(entry) }}</span>
              </div>

              <!-- Row 3: Highest Tier -->
              <div
                class="mt-1 flex items-center text-[10px] text-gray-500 dark:text-gray-400 min-w-0"
                :class="{
                  'opacity-0': !entry.highestTier || entry.highestTier === 'NA'
                }"
              >
                <span class="mr-1 opacity-70 whitespace-nowrap">{{ t('RankedPane.highest') }}</span>
                <div class="flex items-center min-w-0">
                  <img
                    v-if="
                      entry.highestTier &&
                      rankedMedalMap[entry.highestTier]
                    "
                    :src="rankedMedalMap[entry.highestTier]"
                    class="mr-0.5 h-3.5 w-3.5 shrink-0"
                  />
                  <span class="font-bold truncate" :style="{ color: TIER_COLORS[entry.highestTier || 'UNRANKED'] }">
                    {{ formatHighestTier(entry) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RankedTable v-if="rankedStats" :ranked-stats="rankedStats" :region="lcs.auth?.region" />
    </div>
  </NModal>
</template>

<script setup lang="ts">
import RankedBronze from '@renderer-shared/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@renderer-shared/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@renderer-shared/assets/ranked-icons-large/diamond.png'
import RankedEmerald from '@renderer-shared/assets/ranked-icons-large/emerald.png'
import RankedGold from '@renderer-shared/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@renderer-shared/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@renderer-shared/assets/ranked-icons-large/iron.png'
import RankedMaster from '@renderer-shared/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@renderer-shared/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@renderer-shared/assets/ranked-icons-large/silver.png'
import RankedNone from '@renderer-shared/assets/ranked-icons-large/unranked.png'
import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { RankedEntry } from '@shared/types/league-client/ranked'
import {
  RANKED_MASKED_PLACEHOLDER,
  isTencentWinRateUnavailableBelowMaster
} from '@shared/utils/ranked-display'
import { MoreHorizFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useRankedStats } from '../data/ranked-stats'

const { isCrossRegion, isSmallSize } = usePlayerTab()

const { t } = useTranslation()
const isShowingRankedModal = ref(false)

const lcs = useLeagueClientStore()
const { rankedStats, isLoading } = useRankedStats()

// 只显示单双排和灵活组排
const DISPLAY_QUEUE_TYPES = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR']

const displayedRankedEntries = computed(() => {
  if (!rankedStats.value?.queues) return []

  return rankedStats.value.queues
    .filter((entry) => DISPLAY_QUEUE_TYPES.includes(entry.queueType))
    .sort((a, b) => {
      const indexA = DISPLAY_QUEUE_TYPES.indexOf(a.queueType)
      const indexB = DISPLAY_QUEUE_TYPES.indexOf(b.queueType)
      return indexA - indexB
    })
})

const rankedImageMap: Record<string, string> = {
  UNRANKED: RankedNone,
  IRON: RankedIron,
  BRONZE: RankedBronze,
  SILVER: RankedSilver,
  GOLD: RankedGold,
  EMERALD: RankedEmerald,
  PLATINUM: RankedPlatinum,
  DIAMOND: RankedDiamond,
  MASTER: RankedMaster,
  GRANDMASTER: RankedGrandmaster,
  CHALLENGER: RankedChallenger
}

const rankedMedalMap: Record<string, string> = {
  IRON: IronMedal,
  BRONZE: BronzeMedal,
  SILVER: SilverMedal,
  GOLD: GoldMedal,
  PLATINUM: PlatinumMedal,
  EMERALD: EmeraldMedal,
  DIAMOND: DiamondMedal,
  MASTER: MasterMedal,
  GRANDMASTER: GrandmasterMedal,
  CHALLENGER: ChallengerMedal
}

const TIER_COLORS: Record<string, string> = {
  IRON: '#8C8C8C',
  BRONZE: '#AB5E3E',
  SILVER: '#80989D',
  GOLD: '#CD8837',
  PLATINUM: '#4E9996',
  EMERALD: '#2E8B57',
  DIAMOND: '#576BCE',
  MASTER: '#9D5ADE',
  GRANDMASTER: '#D33C3C',
  CHALLENGER: '#F4C330',
  UNRANKED: '#999999'
}

const shouldRender = computed(() => {
  if (isCrossRegion.value) {
    return true
  }
  return displayedRankedEntries.value.length > 0 || isLoading.value
})

const formatTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  const tier = entry.tier
    ? t(`tiers.${entry.tier}`, {
        defaultValue: entry.tier,
        ns: 'common'
      })
    : entry.tier

  if (tier === '' || tier === 'NA') {
    return t('RankedPane.unranked', 'unranked')
  }

  const division = entry.division

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
}

const formatHighestTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  const tier = entry.highestTier
    ? t(`tiers.${entry.highestTier}`, {
        defaultValue: entry.highestTier,
        ns: 'common'
      })
    : entry.highestTier

  if (tier === '' || tier === 'NA') {
    return t('RankedPane.unranked', 'unranked')
  }

  const division = entry.highestDivision

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
}

const formatRankPoints = (entry: Partial<RankedEntry>) => {
  if (entry.ratedRating) {
    return `${entry.ratedRating} ${t('RankedPane.point')}`
  }

  return `${entry.leaguePoints ?? 0} LP`
}

const formatWinLose = (entry: Partial<RankedEntry>) => {
  if (isTencentWinRateUnavailableBelowMaster(lcs.auth?.region, entry)) {
    return RANKED_MASKED_PLACEHOLDER
  }

  return `${entry.wins ?? 0} ${t('RankedPane.win')} ${entry.losses ?? 0} ${t('RankedPane.lose')}`
}

const formatWinRate = (entry: Partial<RankedEntry>) => {
  if (isTencentWinRateUnavailableBelowMaster(lcs.auth?.region, entry)) {
    return RANKED_MASKED_PLACEHOLDER
  }

  const wins = entry.wins ?? 0
  const losses = entry.losses ?? 0
  const totalGames = wins + losses

  if (totalGames <= 0) {
    return '0%'
  }

  return `${((wins / totalGames) * 100).toFixed()}%`
}
</script>
