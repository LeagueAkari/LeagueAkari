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
        class="relative flex h-27 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5"
        :class="isSmallSize ? 'w-30' : 'w-60'"
      >
        <!-- Queue Type Label -->
        <div class="absolute top-0 left-0 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
          {{
            t(`queueTypes.${entry.queueType}`, {
              defaultValue: entry.queueType,
              ns: 'common'
            })
          }}
        </div>

        <!-- Main Content -->
        <div class="relative top-1 flex w-full items-center justify-center gap-2">
          <!-- Image Container -->
          <div v-if="!isSmallSize" class="relative h-12 w-16">
            <img
              class="absolute top-1/2 left-1/2 h-[144%] w-[144%] -translate-x-1/2 -translate-y-1/2 object-contain"
              :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
            />
          </div>

          <!-- Info -->
          <div class="flex min-w-16 flex-col">
            <span class="text-base font-bold text-gray-900 dark:text-gray-100">{{
              formatTier(entry)
            }}</span>
            <span v-if="entry.ratedRating" class="text-xs text-gray-500 dark:text-gray-400">
              {{ entry.wins }} {{ t('RankedPane.win') }} {{ entry.ratedRating }}
              {{ t('RankedPane.point') }}
            </span>
            <span v-else class="text-xs text-gray-500 dark:text-gray-400">
              {{ entry.wins }} {{ t('RankedPane.win') }} {{ entry.leaguePoints }} LP
            </span>

            <!-- Highest Previous Season -->
            <div
              class="flex items-center text-[10px] text-gray-500 dark:text-gray-300"
              :class="{
                'text-gray-400 dark:text-gray-500':
                  !entry.previousSeasonHighestTier || entry.previousSeasonHighestTier === 'NA'
              }"
            >
              <span class="mr-0.5">{{ t('RankedPane.highest') }}</span>
              <div class="flex items-center">
                <img
                  v-if="
                    entry.previousSeasonHighestTier &&
                    rankedMedalMap[entry.previousSeasonHighestTier]
                  "
                  :src="rankedMedalMap[entry.previousSeasonHighestTier]"
                  class="mr-0.5 h-4 w-4"
                />
                <span>{{ formatPreviousTier(entry) }}</span>
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
          class="relative flex h-27 w-60 items-center justify-center rounded bg-black/5 dark:bg-white/5"
        >
          <!-- Queue Type Label -->
          <div class="absolute top-0 left-0 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            {{
              t(`queueTypes.${entry.queueType}`, {
                defaultValue: entry.queueType,
                ns: 'common'
              })
            }}
          </div>

          <!-- Main Content -->
          <div class="relative top-1 flex w-full items-center justify-center gap-2">
            <!-- Image Container -->
            <div class="relative h-12 w-16">
              <img
                class="absolute top-1/2 left-1/2 h-[144%] w-[144%] -translate-x-1/2 -translate-y-1/2 object-contain"
                :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
              />
            </div>

            <!-- Info -->
            <div class="flex min-w-16 flex-col">
              <span class="text-base font-bold text-gray-900 dark:text-gray-100">{{
                formatTier(entry)
              }}</span>
              <span v-if="entry.ratedRating" class="text-xs text-gray-500 dark:text-gray-400">
                {{ entry.wins }} {{ t('RankedPane.win') }} {{ entry.ratedRating }}
                {{ t('RankedPane.point') }}
              </span>
              <span v-else class="text-xs text-gray-500 dark:text-gray-400">
                {{ entry.wins }} {{ t('RankedPane.win') }} {{ entry.leaguePoints }} LP
              </span>

              <!-- Highest Previous Season -->
              <div
                class="flex items-center text-[10px] text-gray-500 dark:text-gray-300"
                :class="{
                  'text-gray-400 dark:text-gray-500':
                    !entry.previousSeasonHighestTier || entry.previousSeasonHighestTier === 'NA'
                }"
              >
                <span class="mr-0.5">{{ t('RankedPane.highest') }}</span>
                <div class="flex items-center">
                  <img
                    v-if="
                      entry.previousSeasonHighestTier &&
                      rankedMedalMap[entry.previousSeasonHighestTier]
                    "
                    :src="rankedMedalMap[entry.previousSeasonHighestTier]"
                    class="mr-0.5 h-4 w-4"
                  />
                  <span>{{ formatPreviousTier(entry) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RankedTable v-if="rankedStats" :ranked-stats="rankedStats" />
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
import { RankedEntry } from '@shared/types/league-client/ranked'
import { MoreHorizFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useRankedStats } from '../data/ranked-stats'

const { isCrossRegion, isSmallSize } = usePlayerTab()

const { t } = useTranslation()
const isShowingRankedModal = ref(false)

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

const formatPreviousTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  const tier = entry.previousSeasonHighestTier
    ? t(`tiers.${entry.previousSeasonHighestTier}`, {
        defaultValue: entry.previousSeasonHighestTier,
        ns: 'common'
      })
    : entry.previousSeasonHighestTier

  if (tier === '' || tier === 'NA') {
    return t('RankedPane.unranked', 'unranked')
  }

  const division = entry.previousSeasonHighestDivision

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
}
</script>
