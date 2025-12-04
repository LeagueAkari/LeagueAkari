<template>
  <div v-if="shouldRender" class="relative flex gap-4">
    <!-- Cross Region Unsupported Card -->
    <div
      v-if="isCrossRegion"
      class="relative flex h-108px w-60 flex-col items-center justify-center rounded border border-white/10 text-xs text-[#414141] dark:text-[#828282]"
    >
      <div>{{ t('RankedDisplay.crossRegion', '当前为跨区环境') }}</div>
      <div>{{ t('RankedDisplay.unavailable', '无法获取排位队列信息') }}</div>
    </div>

    <!-- Ranked Cards -->
    <template v-else>
      <div
        v-for="entry in mockData"
        :key="entry.queueType"
        class="relative flex h-108px w-60 items-center justify-center rounded dark:bg-white/5 bg-black/5"
      >
        <!-- Queue Type Label -->
        <div class="absolute left-0 top-0 px-2 py-1 text-xs text-[#c8c8c8]">
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
              class="absolute left-1/2 top-1/2 h-144% w-144% -translate-x-1/2 -translate-y-1/2 object-contain"
              :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
            />
          </div>

          <!-- Info -->
          <div class="flex min-w-16 flex-col">
            <span class="text-base font-bold">{{ formatTier(entry) }}</span>
            <span v-if="entry.ratedRating" class="text-xs text-[#929292]">
              {{ entry.wins }} {{ t('RankedDisplay.win') }} {{ entry.ratedRating }}
              {{ t('RankedDisplay.point') }}
            </span>
            <span v-else class="text-xs text-[#929292]">
              {{ entry.wins }} {{ t('RankedDisplay.win') }} {{ entry.leaguePoints }} LP
            </span>

            <!-- Highest Previous Season -->
            <div
              class="flex items-center text-10px text-[#c8c8c8]"
              :class="{
                'text-[#777777]':
                  !entry.previousSeasonHighestTier || entry.previousSeasonHighestTier === 'NA'
              }"
            >
              <span class="mr-0.5">{{ t('RankedDisplay.highest') }}</span>
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
      <div class="absolute -bottom-1.5 -right-2">
        <NButton
          :focusable="false"
          :title="t('MatchHistoryTab.rankedMore', '更多排位信息')"
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
    <div class="flex flex-col items-center rounded bg-[rgba(25,25,28,0.98)] p-4">
      <div class="mb-4 grid grid-cols-2 gap-4">
        <div
          v-for="entry in mockData"
          :key="entry.queueType"
          class="relative flex h-108px w-60 items-center justify-center rounded dark:bg-white/5 bg-black/5"
        >
          <!-- Queue Type Label -->
          <div class="absolute left-0 top-0 px-2 py-1 text-xs text-[#c8c8c8]">
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
                class="absolute left-1/2 top-1/2 h-144% w-144% -translate-x-1/2 -translate-y-1/2 object-contain"
                :src="rankedImageMap[entry.tier || 'UNRANKED'] || rankedImageMap['UNRANKED']"
              />
            </div>

            <!-- Info -->
            <div class="flex min-w-16 flex-col">
              <span class="text-base font-bold">{{ formatTier(entry) }}</span>
              <span v-if="entry.ratedRating" class="text-xs text-[#929292]">
                {{ entry.wins }} {{ t('RankedDisplay.win') }} {{ entry.ratedRating }}
                {{ t('RankedDisplay.point') }}
              </span>
              <span v-else class="text-xs text-[#929292]">
                {{ entry.wins }} {{ t('RankedDisplay.win') }} {{ entry.leaguePoints }} LP
              </span>

              <!-- Highest Previous Season -->
              <div
                class="flex items-center text-10px text-[#c8c8c8]"
                :class="{
                  'text-#777777':
                    !entry.previousSeasonHighestTier || entry.previousSeasonHighestTier === 'NA'
                }"
              >
                <span class="mr-0.5">{{ t('RankedDisplay.highest') }}</span>
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
      <RankedTable :ranked-stats="mockRankedStats" />
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
import { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'
import { MoreHorizFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import { useMatchHistoryTab } from '../context'

const { isCrossRegion } = useMatchHistoryTab()
const { t } = useTranslation()
const isShowingRankedModal = ref(false)

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

const mockData: Partial<RankedEntry>[] = [
  {
    queueType: 'RANKED_SOLO_5x5',
    tier: 'DIAMOND',
    division: 'I',
    leaguePoints: 75,
    wins: 120,
    losses: 100,
    previousSeasonEndTier: 'PLATINUM',
    previousSeasonEndDivision: 'I',
    previousSeasonHighestTier: 'PLATINUM',
    previousSeasonHighestDivision: 'I',
    highestTier: 'DIAMOND',
    highestDivision: 'I',
    ratedTier: 'NONE',
    ratedRating: 0
  },
  {
    queueType: 'RANKED_FLEX_SR',
    tier: 'GOLD',
    division: 'IV',
    leaguePoints: 20,
    wins: 45,
    losses: 40,
    previousSeasonEndTier: 'GOLD',
    previousSeasonEndDivision: 'IV',
    previousSeasonHighestTier: 'GOLD',
    previousSeasonHighestDivision: 'IV',
    highestTier: 'GOLD',
    highestDivision: 'IV',
    ratedTier: 'NONE',
    ratedRating: 0
  }
]

const mockRankedStats = {
  queues: mockData as any[]
} as RankedStats

const shouldRender = computed(() => {
  if (isCrossRegion.value) {
    return true
  }
  return mockData.length > 0
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
    return t('RankedDisplay.unranked', '未定级')
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
    return t('RankedDisplay.unranked', '未定级')
  }

  const division = entry.previousSeasonHighestDivision

  if (division === '' || division === 'NA') {
    return tier
  }

  return `${tier} ${division}`
}
</script>
