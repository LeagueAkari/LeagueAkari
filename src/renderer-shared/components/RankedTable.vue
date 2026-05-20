<template>
  <div
    class="w-fit max-w-full overflow-x-auto rounded-md border border-black/10 bg-white/55 text-xs text-black shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/4 dark:text-gray-300 dark:shadow-black/20"
  >
    <table class="min-w-max border-collapse border-spacing-0">
      <thead class="bg-black/4 dark:bg-white/6">
        <tr>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.queueType') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.tier') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.leaguePoints') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.wins') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.losses') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.previousSeasonEndTier') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.previousSeasonHighestTier') }}
          </th>
          <th class="ranked-table-header-cell">
            {{ t('RankedTable.highestTier') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r of sortedQueues"
          :key="r.queueType"
          class="border-t border-black/[0.07] transition-colors hover:bg-black/2.5 dark:border-white/8 dark:hover:bg-white/[0.035]"
        >
          <td class="ranked-table-cell font-medium text-black/80 dark:text-gray-200">
            {{ formatQueueName(r.queueType) }}
          </td>
          <td class="ranked-table-cell">
            <div
              class="flex items-center justify-center gap-1 whitespace-nowrap"
              :class="placeholderClass(formatTierDivision(r, 'current'))"
            >
              <img
                v-if="RANKED_MEDAL_MAP[getTierForDisplay(r, 'current')]"
                :src="RANKED_MEDAL_MAP[getTierForDisplay(r, 'current')]"
                alt="tier"
                class="h-4 w-4 shrink-0 align-middle"
              />
              {{ formatTierDivision(r, 'current') }}
            </div>
          </td>
          <td class="ranked-table-cell">
            <span :class="placeholderClass(formatPoints(r))">{{ formatPoints(r) }}</span>
          </td>
          <td class="ranked-table-cell">
            <span :class="placeholderClass(formatWins(r))">{{ formatWins(r) }}</span>
          </td>
          <td class="ranked-table-cell">
            <span :class="placeholderClass(formatLosses(r))">{{ formatLosses(r) }}</span>
          </td>
          <td class="ranked-table-cell">
            <div
              class="flex items-center justify-center gap-1 whitespace-nowrap"
              :class="placeholderClass(formatTierDivision(r, 'previousSeasonEnd'))"
            >
              <img
                v-if="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
                :src="RANKED_MEDAL_MAP[r.previousSeasonEndTier]"
                alt="tier"
                class="h-4 w-4 shrink-0 align-middle"
              />
              {{ formatTierDivision(r, 'previousSeasonEnd') }}
            </div>
          </td>
          <td class="ranked-table-cell">
            <div
              class="flex items-center justify-center gap-1 whitespace-nowrap"
              :class="placeholderClass(formatTierDivision(r, 'previousSeasonHighest'))"
            >
              <img
                v-if="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
                :src="RANKED_MEDAL_MAP[r.previousSeasonHighestTier]"
                alt="tier"
                class="h-4 w-4 shrink-0 align-middle"
              />
              {{ formatTierDivision(r, 'previousSeasonHighest') }}
            </div>
          </td>
          <td class="ranked-table-cell">
            <div
              class="flex items-center justify-center gap-1 whitespace-nowrap"
              :class="placeholderClass(formatTierDivision(r, 'highest'))"
            >
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
  </div>
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
import { computed } from 'vue'

const props = defineProps<{
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
  RANKED_TFT: 3,
  RANKED_TFT_TURBO: 4,
  RANKED_TFT_DOUBLE_UP: 5
}

const formatQueueName = (queueType: string) => {
  return t(`queueTypes.${queueType}`, {
    ns: 'common',
    defaultValue: queueType
  })
}

const formatWins = (entry: RankedEntry) => {
  if (isUnrankedTier(entry.tier)) {
    return '—'
  }

  return entry.wins
}

const formatPoints = (entry: RankedEntry) => {
  if (isUnrankedTier(entry.tier)) {
    return '—'
  }

  return entry.leaguePoints
}

const sortedQueues = computed(() => {
  return [...props.rankedStats.queues].sort((a, b) => {
    return (
      (QUEUE_TYPE_ORDER[a.queueType] ?? Number.MAX_SAFE_INTEGER) -
      (QUEUE_TYPE_ORDER[b.queueType] ?? Number.MAX_SAFE_INTEGER)
    )
  })
})

const isUnrankedTier = (tier: string | undefined | null) => {
  return !tier || tier === 'NA' || tier === 'NONE'
}

const placeholderClass = (value: string | number) => {
  return value === '—'
    ? 'text-black/[0.35] dark:text-white/[0.30]'
    : 'text-black/80 dark:text-gray-100'
}

const getTierForDisplay = (entry: RankedEntry, type: string) => {
  switch (type) {
    case 'current':
      return entry.tier
    case 'previousSeasonEnd':
      return entry.previousSeasonEndTier
    case 'previousSeasonHighest':
      return entry.previousSeasonHighestTier
    case 'highest':
      return entry.highestTier
    default:
      return ''
  }
}

const formatTierDivision = (entry: RankedEntry, type: string) => {
  let tier: string | undefined
  let division: string
  switch (type) {
    case 'current':
      tier = getTierForDisplay(entry, type)
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

  if (isUnrankedTier(tier)) {
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

const formatLosses = (entry: RankedEntry) => {
  if (isUnrankedTier(entry.tier)) {
    return '—'
  }

  return entry.losses
}
</script>

<style scoped>
.ranked-table-header-cell {
  border-left: 1px solid rgb(0 0 0 / 0.06);
  padding: 0.375rem 0.625rem;
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  color: rgb(0 0 0 / 0.6);
}

.ranked-table-header-cell:first-child {
  border-left: 0;
}

.ranked-table-cell {
  border-left: 1px solid rgb(0 0 0 / 0.06);
  padding: 0.375rem 0.625rem;
  text-align: center;
  white-space: nowrap;
}

.ranked-table-cell:first-child {
  border-left: 0;
}

[data-theme='dark'] .ranked-table-header-cell {
  border-left-color: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.6);
}

[data-theme='dark'] .ranked-table-cell {
  border-left-color: rgb(255 255 255 / 0.08);
}
</style>
