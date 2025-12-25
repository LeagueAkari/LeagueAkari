<template>
  <table
    class="w-min border-collapse border-spacing-0 border border-black/20 text-xs text-black dark:border-white/25 dark:text-gray-300"
  >
    <thead>
      <tr>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.queueType') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.tier') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.leaguePoints') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.wins') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.losses') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.previousSeasonEndTier') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.previousSeasonHighestTier') }}
        </th>
        <th
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ t('RankedTable.highestTier') }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r of sortedQueues" :key="r.queueType">
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ formatQueueName(r.queueType) }}
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          <div class="flex items-center justify-center gap-1 whitespace-nowrap">
            <img
              v-if="RANKED_MEDAL_MAP[r.tier]"
              :src="RANKED_MEDAL_MAP[r.tier]"
              alt="tier"
              class="h-4 w-4 shrink-0 align-middle"
            />
            {{ formatTierDivision(r, 'current') }}
          </div>
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ formatPoints(r) }}
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ formatWins(r) }}
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          {{ formatLosses(r.losses) }}
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          <div class="flex items-center justify-center gap-1 whitespace-nowrap">
            <img
              v-if="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
              :src="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
              alt="tier"
              class="h-4 w-4 shrink-0 align-middle"
            />
            {{ formatTierDivision(r, 'previousSeasonEnd') }}
          </div>
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          <div class="flex items-center justify-center gap-1 whitespace-nowrap">
            <img
              v-if="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
              :src="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
              alt="tier"
              class="h-4 w-4 shrink-0 align-middle"
            />
            {{ formatTierDivision(r, 'previousSeasonHighest') }}
          </div>
        </td>
        <td
          class="border border-black/20 px-1 py-0.5 text-center whitespace-nowrap text-black dark:border-white/25 dark:text-gray-100"
        >
          <div class="flex items-center justify-center gap-1 whitespace-nowrap">
            <img
              v-if="RANKED_MEDAL_MAP[r.highestTier]"
              :src="RANKED_MEDAL_MAP[r.highestTier]"
              alt="tier"
              class="h-4 w-4 shrink-0 align-middle"
            />
            {{ formatTierDivision(r, 'highest') }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
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
import { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'
import { useTranslation } from 'i18next-vue'

const { rankedStats } = defineProps<{
  rankedStats: RankedStats
}>()

const { t } = useTranslation()

const RANKED_MEDAL_MAP: Record<string, string> = {
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

const QUEUE_TYPE_ORDER: Record<string, number> = {
  RANKED_SOLO_5x5: 1,
  RANKED_FLEX_SR: 2,
  CHERRY: 3,
  RANKED_TFT: 4,
  RANKED_TFT_TURBO: 5,
  RANKED_TFT_DOUBLE_UP: 6
}

const formatQueueName = (queueType: string) => {
  return t(`queueTypes.${queueType}`, {
    ns: 'common',
    defaultValue: queueType
  })
}

const formatWins = (entry: RankedEntry) => {
  if (entry.queueType === 'CHERRY') {
    return entry.ratedTier === 'NONE' ? '—' : entry.wins
  }

  if (!entry.tier || entry.tier === 'NA') {
    return '—'
  }

  return entry.wins
}

const formatPoints = (entry: RankedEntry) => {
  if (entry.queueType === 'CHERRY') {
    return entry.ratedTier === 'NONE' ? '—' : entry.ratedRating
  }

  if (!entry.tier || entry.tier === 'NA') {
    return '—'
  }

  return entry.leaguePoints
}

const sortedQueues = rankedStats.queues.sort((a, b) => {
  return QUEUE_TYPE_ORDER[a.queueType] - QUEUE_TYPE_ORDER[b.queueType]
})

const formatTierDivision = (entry: RankedEntry, type: string) => {
  let tier: string
  let division: string
  switch (type) {
    case 'current':
      tier = entry.tier
      division = entry.division
      break
    case 'previousSeasonEnd':
      tier = entry.previousSeasonEndTier
      division = entry.previousSeasonEndDivision
      break
    case 'previousSeasonHighest':
      tier = entry.previousSeasonHighestTier
      division = entry.previousSeasonHighestDivision
      break
    case 'highest':
      tier = entry.highestTier
      division = entry.highestDivision
      break
    default:
      tier = ''
      division = ''
  }

  if (!tier || tier === 'NA') {
    return '—'
  }

  if (!division || division === 'NA') {
    return t(`tiers.${tier}`, {
      ns: 'common',
      defaultValue: tier
    })
  }

  return `${t(`tiers.${tier}`, {
    ns: 'common',
    defaultValue: tier
  })} ${division}`
}

const formatLosses = (losses: number) => {
  return losses || '—'
}
</script>

<style scoped></style>
